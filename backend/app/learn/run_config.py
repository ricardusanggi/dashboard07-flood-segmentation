# backend/app/learn/run_config.py
#
# Entry point training U-Net untuk segmentasi.

import copy
import json
import random
import base64
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from datetime import datetime
from pathlib import Path
from io import BytesIO
from PIL import Image
from torch.utils.data import DataLoader

from mealpy import FloatVar, PSO

from .dataset import build_datasets
from .model_unet import UNet, UNetResNet
from .model_deeplab import build_deeplab
from .trainer_epoch import train_one_epoch
from .evaluator import evaluate
from .devices import auto_device
from .metrics import iou_score, dice_score, pixel_accuracy


# =====================================================
# UTIL: tensor → base64 JPEG
# =====================================================
def _tensor_to_base64(img_tensor: torch.Tensor) -> str:
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std  = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img_tensor = img_tensor.cpu() * std + mean
    img_tensor = torch.clamp(img_tensor, 0, 1)
    arr = (img_tensor * 255).byte().permute(1, 2, 0).numpy()
    pil = Image.fromarray(arr)
    buf = BytesIO()
    pil.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode()


def _mask_to_base64(mask_tensor: torch.Tensor, threshold: float = 0.5) -> str:
    prob = torch.sigmoid(mask_tensor.cpu()).squeeze()
    arr = ((prob >= threshold).float() * 255).byte().numpy()
    pil = Image.fromarray(arr, mode="L")
    buf = BytesIO()
    pil.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# =====================================================
# MODEL FACTORY
# =====================================================

_UNET_RESNET_BACKBONES = {"resnet18", "resnet34", "resnet50", "resnet101"}
_DEEPLAB_BACKBONES = {
    "deeplab":          "resnet50",
    "deeplab_resnet50": "resnet50",
    "deeplab_resnet101":"resnet101",
    "deeplab_mobilenet":"mobilenet",
}


def _build_model(arch: str, device, pretrained: bool = True):
    """Buat model sesuai arsitektur."""
    a = arch.lower()

    # --- DeepLab variants ---
    if a in _DEEPLAB_BACKBONES:
        backbone = _DEEPLAB_BACKBONES[a]
        return build_deeplab(backbone=backbone, out_channels=1, pretrained=pretrained).to(device)

    # --- UNet + ResNet encoder ---
    if a.startswith("unet_"):
        backbone = a[len("unet_"):]
        if backbone in _UNET_RESNET_BACKBONES:
            return UNetResNet(backbone=backbone, pretrained=pretrained, out_channels=1).to(device)

    # --- Vanilla UNet (default) ---
    return UNet(in_channels=3, out_channels=1).to(device)


# =====================================================
# OPTIMIZER
# =====================================================
def build_optimizer(model, cfg: dict):
    opt = cfg.get("optimizer", "adam").lower()
    lr  = cfg.get("learning_rate", 1e-4)

    mapping = {
        "adam":   torch.optim.Adam,
        "adamw":  torch.optim.AdamW,
        "sgd":    lambda p, lr: torch.optim.SGD(p, lr=lr, momentum=0.9),
        "rmsprop": torch.optim.RMSprop,
    }

    factory = mapping.get(opt)
    if factory is None:
        return torch.optim.Adam(model.parameters(), lr=lr)

    if opt == "sgd":
        return factory(model.parameters(), lr)
    return factory(model.parameters(), lr=lr)


# =====================================================
# PSO: short training untuk evaluasi lr
# =====================================================
def _run_short_training(dataset_dir: str, cfg: dict, device):
    train_ds, val_ds = build_datasets(
        dataset_dir,
        img_size=tuple(cfg["img_size"]),
        val_split=cfg["val_split"],
        augment=cfg.get("augmentation", True),
    )

    pso_arch = cfg.get("architecture", "unet").lower()
    model = _build_model(pso_arch, device, pretrained=cfg.get("deeplab_pretrained", True))
    optimizer = build_optimizer(model, cfg)

    loader = DataLoader(train_ds, batch_size=cfg["batch_size"], shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=cfg["batch_size"], shuffle=False)

    for _ in range(min(cfg.get("pso_epochs", 2), 2)):
        train_one_epoch(model, loader, optimizer, device, cfg["loss_function"])

    metrics = evaluate(model, val_loader, device, cfg["loss_function"])
    return metrics["iou"]


# =====================================================
# MAIN ENTRY POINT
# =====================================================
def run_config(run_id, dataset_dir, output_dir, cfg, update_callback):

    device = auto_device()
    update_callback(f"Using device: {device}")

    img_size = tuple(cfg["img_size"])
    loss_fn  = cfg.get("loss_function", "bce_dice")

    # =====================================================
    # OPTIONAL PSO
    # =====================================================
    if cfg.get("use_pso", False):
        update_callback("PSO enabled — mencari learning rate optimal")

        base_cfg = copy.deepcopy(cfg)

        def objective(solution):
            trial_cfg = copy.deepcopy(base_cfg)
            trial_cfg["learning_rate"] = float(solution[0])
            iou = _run_short_training(dataset_dir, trial_cfg, device)
            return 1.0 - iou

        bounds = FloatVar(
            lb=(cfg.get("pso_lr_bounds", [1e-5, 1e-3])[0],),
            ub=(cfg.get("pso_lr_bounds", [1e-5, 1e-3])[1],),
            name="learning_rate",
        )
        pso = PSO.OriginalPSO(
            epoch=cfg.get("pso_iters", 10),
            pop_size=cfg.get("pso_population", 5),
        )
        best = pso.solve({"bounds": bounds, "obj_func": objective, "minmax": "min"})
        cfg["learning_rate"] = float(best.solution[0])
        update_callback(f"PSO best lr = {cfg['learning_rate']:.6f}")

    # =====================================================
    # DATASET
    # =====================================================
    train_ds, val_ds = build_datasets(
        dataset_dir,
        img_size=img_size,
        val_split=cfg["val_split"],
        augment=cfg.get("augmentation", True),
    )
    update_callback(f"Dataset: {len(train_ds)} train, {len(val_ds)} val")

    train_loader = DataLoader(train_ds, batch_size=cfg["batch_size"], shuffle=True)
    val_loader   = DataLoader(val_ds,   batch_size=cfg["batch_size"], shuffle=False)

    # =====================================================
    # MODEL
    # =====================================================
    arch = cfg.get("architecture", "unet").lower()
    model = _build_model(arch, device, pretrained=cfg.get("deeplab_pretrained", True))
    optimizer = build_optimizer(model, cfg)

    # =====================================================
    # RUN DIRECTORY
    # =====================================================
    run_dir = Path(output_dir) / f"run_{run_id}"
    run_dir.mkdir(parents=True, exist_ok=True)
    best_model_path = run_dir / "model.pth"

    # =====================================================
    # TRAINING HISTORY
    # =====================================================
    history = {
        "epoch":      [],
        "train_loss": [],
        "val_loss":   [],
        "train_iou":  [],
        "val_iou":    [],
        "train_dice": [],
        "val_dice":   [],
    }

    best_val_iou = 0.0
    best_state   = None

    update_callback("Memulai training U-Net")

    for epoch in range(1, cfg["epochs"] + 1):

        train_m = train_one_epoch(model, train_loader, optimizer, device, loss_fn)
        val_m   = evaluate(model, val_loader, device, loss_fn)

        history["epoch"].append(epoch)
        history["train_loss"].append(float(train_m["loss"]))
        history["val_loss"].append(float(val_m["loss"]))
        history["train_iou"].append(float(train_m["iou"]))
        history["val_iou"].append(float(val_m["iou"]))
        history["train_dice"].append(float(train_m["dice"]))
        history["val_dice"].append(float(val_m["dice"]))

        update_callback(
            f"[Epoch {epoch}/{cfg['epochs']}] "
            f"loss={train_m['loss']:.4f} | "
            f"val_iou={val_m['iou']:.4f} val_dice={val_m['dice']:.4f}"
        )

        if val_m["iou"] > best_val_iou:
            best_val_iou = val_m["iou"]
            best_state = {
                "model":      copy.deepcopy(model.state_dict()),
                "train_loss": train_m["loss"],
                "val_loss":   val_m["loss"],
                "val_metrics": val_m,
            }
            torch.save({
                "architecture": arch,
                "model_state_dict": model.state_dict(),
            }, best_model_path)
            update_callback(f"Model terbaik tersimpan (IoU={best_val_iou:.4f})")

    if best_state is None:
        best_state = {
            "model":       model.state_dict(),
            "train_loss":  train_m["loss"],
            "val_loss":    val_m["loss"],
            "val_metrics": val_m,
        }

    # =====================================================
    # POST-TRAINING EVALUATION (best model)
    # =====================================================
    model.load_state_dict(best_state["model"])
    model.eval()

    final_m = evaluate(model, val_loader, device, loss_fn)

    metrics_out = {
        "iou":           float(final_m["iou"]),
        "dice":          float(final_m["dice"]),
        "pixel_acc":     float(final_m["pixel_acc"]),
        "best_train_loss": float(best_state["train_loss"] or 0.0),
        "best_val_loss":   float(best_state["val_loss"] or 0.0),
    }

    # =====================================================
    # SIMPAN ARTEFAK
    # =====================================================
    with open(run_dir / "metrics.json", "w") as f:
        json.dump(metrics_out, f, indent=2)

    with open(run_dir / "metrics_history.json", "w") as f:
        json.dump(history, f, indent=2)

    # class_mapping.json — dibaca oleh model_manager untuk deteksi arsitektur
    with open(run_dir / "class_mapping.json", "w") as f:
        json.dump({"task": "segmentation", "architecture": arch}, f, indent=2)

    # training_artifact.json
    artifact = {
        "run_id": run_id,
        "dataset": {"path": dataset_dir, "task": "segmentation"},
        "training": {
            "architecture": arch,
            "epochs": cfg.get("epochs"),
            "batch_size": cfg.get("batch_size"),
            "learning_rate": cfg.get("learning_rate"),
            "optimizer": cfg.get("optimizer"),
            "loss_function": loss_fn,
            "val_split": cfg.get("val_split"),
            "device": str(device),
            "use_pso": cfg.get("use_pso", False),
        },
        "metrics": metrics_out,
        "model": {"file": "model.pth"},
        "trained_at": datetime.utcnow().isoformat(),
    }

    with open(run_dir / "training_artifact.json", "w") as f:
        json.dump(artifact, f, indent=2)

    # =====================================================
    # PLOT HISTORY
    # =====================================================
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].plot(history["train_loss"], label="train")
    axes[0].plot(history["val_loss"],   label="val")
    axes[0].set_title("Loss")
    axes[0].legend()

    axes[1].plot(history["train_iou"],  label="train IoU")
    axes[1].plot(history["val_iou"],    label="val IoU")
    axes[1].plot(history["train_dice"], label="train Dice", linestyle="--")
    axes[1].plot(history["val_dice"],   label="val Dice",   linestyle="--")
    axes[1].set_title("IoU & Dice")
    axes[1].legend()

    plt.tight_layout()
    plt.savefig(run_dir / "training_plot.png")
    plt.close()

    # =====================================================
    # PREVIEW SAMPLES (segmentasi)
    # =====================================================
    samples = []
    with torch.no_grad():
        for imgs, masks in val_loader:
            imgs  = imgs.to(device)
            masks = masks.to(device)
            preds = model(imgs)
            for i in range(min(len(imgs), 6 - len(samples))):
                samples.append({
                    "image_base64":     _tensor_to_base64(imgs[i]),
                    "mask_base64":      _mask_to_base64(masks[i]),
                    "predicted_base64": _mask_to_base64(preds[i]),
                    "iou":  round(iou_score(preds[i:i+1], masks[i:i+1]), 4),
                    "dice": round(dice_score(preds[i:i+1], masks[i:i+1]), 4),
                })
            if len(samples) >= 6:
                break

    with open(run_dir / "preview_samples.json", "w") as f:
        json.dump(samples, f, indent=2)

    # =====================================================
    # RETURN
    # =====================================================
    return {
        "model_path": str(run_dir),
        "metrics": metrics_out,
        "used_pso": cfg.get("use_pso", False),
        "best_lr":  cfg["learning_rate"] if cfg.get("use_pso") else None,
    }
