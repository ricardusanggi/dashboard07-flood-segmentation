# backend/app/learn/trainer_epoch.py
#
# Training satu epoch untuk model segmentasi (U-Net).

import torch
from .metrics import get_loss_fn, iou_score, dice_score, pixel_accuracy


def train_one_epoch(
    model,
    loader,
    optimizer,
    device,
    loss_fn: str = "bce_dice",
):
    """
    Training satu epoch segmentasi.

    loader  : DataLoader yang menghasilkan (image_tensor, mask_tensor)
    loss_fn : "bce" | "dice" | "bce_dice" | "iou"

    Returns
    -------
    dict: loss, iou, dice, pixel_acc
    """
    model.train()

    criterion = get_loss_fn(loss_fn)

    total_loss = 0.0
    total_iou = 0.0
    total_dice = 0.0
    total_pix = 0.0
    n_batches = 0

    for imgs, masks in loader:

        imgs = imgs.to(device)
        masks = masks.to(device)

        optimizer.zero_grad()

        preds = model(imgs)

        loss = criterion(preds, masks)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        total_iou += iou_score(preds.detach(), masks.detach())
        total_dice += dice_score(preds.detach(), masks.detach())
        total_pix += pixel_accuracy(preds.detach(), masks.detach())
        n_batches += 1

    n = max(n_batches, 1)

    return {
        "loss": total_loss / n,
        "iou": total_iou / n,
        "dice": total_dice / n,
        "pixel_acc": total_pix / n,
    }
