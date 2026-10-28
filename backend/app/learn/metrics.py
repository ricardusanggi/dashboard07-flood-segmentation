# backend/app/learn/metrics.py
#
# Metrik segmentasi biner.
# Semua fungsi bekerja pada Tensor PyTorch (B,1,H,W) atau (B,H,W).

import torch


# ============================================================
# HELPER: binarisasi
# ============================================================

def _binarize(tensor: torch.Tensor, threshold: float = 0.5) -> torch.Tensor:
    """Sigmoid + threshold → 0/1."""
    return (torch.sigmoid(tensor) >= threshold).float()


# ============================================================
# IoU (Intersection over Union / Jaccard)
# ============================================================

def iou_score(pred: torch.Tensor, target: torch.Tensor, threshold: float = 0.5, eps: float = 1e-6) -> float:
    """
    pred   : logit atau probabilitas (B,1,H,W) atau (B,H,W)
    target : mask biner (B,1,H,W) atau (B,H,W), nilai 0/1
    """
    pred_bin = _binarize(pred, threshold).view(-1)
    target_flat = target.float().view(-1)

    inter = (pred_bin * target_flat).sum()
    union = pred_bin.sum() + target_flat.sum() - inter

    return float((inter + eps) / (union + eps))


# ============================================================
# Dice / F1
# ============================================================

def dice_score(pred: torch.Tensor, target: torch.Tensor, threshold: float = 0.5, eps: float = 1e-6) -> float:
    pred_bin = _binarize(pred, threshold).view(-1)
    target_flat = target.float().view(-1)

    inter = (pred_bin * target_flat).sum()
    return float((2.0 * inter + eps) / (pred_bin.sum() + target_flat.sum() + eps))


# ============================================================
# Pixel Accuracy
# ============================================================

def pixel_accuracy(pred: torch.Tensor, target: torch.Tensor, threshold: float = 0.5) -> float:
    pred_bin = _binarize(pred, threshold).view(-1)
    target_flat = target.float().view(-1)
    correct = (pred_bin == target_flat).sum().item()
    return correct / target_flat.numel()


# ============================================================
# LOSS FUNCTIONS
# ============================================================

def bce_loss(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    return torch.nn.functional.binary_cross_entropy_with_logits(pred, target)


def dice_loss(pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-6) -> torch.Tensor:
    prob = torch.sigmoid(pred)
    inter = (prob * target).sum(dim=(1, 2, 3))
    union = prob.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3))
    return 1.0 - ((2.0 * inter + eps) / (union + eps)).mean()


def bce_dice_loss(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    return 0.5 * bce_loss(pred, target) + 0.5 * dice_loss(pred, target)


def iou_loss(pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-6) -> torch.Tensor:
    prob = torch.sigmoid(pred)
    inter = (prob * target).sum(dim=(1, 2, 3))
    union = prob.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3)) - inter
    return 1.0 - ((inter + eps) / (union + eps)).mean()


def get_loss_fn(name: str):
    mapping = {
        "bce": bce_loss,
        "dice": dice_loss,
        "bce_dice": bce_dice_loss,
        "iou": iou_loss,
    }
    fn = mapping.get(name.lower())
    if fn is None:
        raise ValueError(f"Loss function tidak dikenal: {name}")
    return fn
