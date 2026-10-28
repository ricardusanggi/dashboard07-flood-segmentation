# backend/app/learn/model_deeplab.py
#
# DeepLabV3+ untuk segmentasi biner berbasis torchvision.
# Mendukung backbone: resnet50, resnet101, mobilenet
# Output: (B, 1, H, W) logit — gunakan sigmoid untuk probabilitas.

import torch
import torch.nn as nn
import torchvision.models.segmentation as seg_models
from torchvision.models.segmentation import (
    DeepLabV3_ResNet50_Weights,
    DeepLabV3_ResNet101_Weights,
    DeepLabV3_MobileNet_V3_Large_Weights,
)


class DeepLabV3Binary(nn.Module):
    """
    DeepLabV3+ yang dimodifikasi untuk segmentasi biner (output 1 channel).
    Classifier head terakhir diganti Conv2d 1-channel.
    """

    def __init__(
        self,
        backbone: str = "resnet50",
        out_channels: int = 1,
        pretrained: bool = True,
    ):
        super().__init__()

        if backbone == "resnet101":
            weights = DeepLabV3_ResNet101_Weights.DEFAULT if pretrained else None
            base = seg_models.deeplabv3_resnet101(weights=weights)
        elif backbone == "mobilenet":
            weights = DeepLabV3_MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
            base = seg_models.deeplabv3_mobilenet_v3_large(weights=weights)
        else:
            weights = DeepLabV3_ResNet50_Weights.DEFAULT if pretrained else None
            base = seg_models.deeplabv3_resnet50(weights=weights)

        in_feat = base.classifier[-1].in_channels
        base.classifier[-1] = nn.Conv2d(in_feat, out_channels, kernel_size=1)
        base.aux_classifier = None

        self.backbone = base

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)["out"]


# ============================================================
# FACTORY
# ============================================================

def build_deeplab(
    backbone: str = "resnet50",
    out_channels: int = 1,
    pretrained: bool = True,
) -> DeepLabV3Binary:
    return DeepLabV3Binary(
        backbone=backbone,
        out_channels=out_channels,
        pretrained=pretrained,
    )
