# backend/app/learn/evaluator.py
#
# Evaluasi model segmentasi pada validation set.

import torch
from .metrics import get_loss_fn, iou_score, dice_score, pixel_accuracy


def evaluate(model, loader, device, loss_fn: str = "bce_dice"):
    """
    Evaluasi model segmentasi pada validation/test set.

    Returns
    -------
    dict: loss, iou, dice, pixel_acc
    """
    model.eval()

    criterion = get_loss_fn(loss_fn)

    total_loss = 0.0
    total_iou = 0.0
    total_dice = 0.0
    total_pix = 0.0
    n_batches = 0

    with torch.no_grad():

        for imgs, masks in loader:

            imgs = imgs.to(device)
            masks = masks.to(device)

            preds = model(imgs)

            loss = criterion(preds, masks)

            total_loss += loss.item()
            total_iou += iou_score(preds, masks)
            total_dice += dice_score(preds, masks)
            total_pix += pixel_accuracy(preds, masks)
            n_batches += 1

    n = max(n_batches, 1)

    return {
        "loss": total_loss / n,
        "iou": total_iou / n,
        "dice": total_dice / n,
        "pixel_acc": total_pix / n,
    }
