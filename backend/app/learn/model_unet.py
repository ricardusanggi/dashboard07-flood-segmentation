# backend/app/learn/model_unet.py

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models


class DoubleConv(nn.Module):
    """Dua conv 3x3 + BN + ReLU"""

    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class Down(nn.Module):
    """MaxPool → DoubleConv"""

    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_ch, out_ch),
        )

    def forward(self, x):
        return self.block(x)


class Up(nn.Module):
    """Upsample → concat skip → DoubleConv"""

    def __init__(self, in_ch: int, out_ch: int, bilinear: bool = True):
        super().__init__()
        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)
            self.conv = DoubleConv(in_ch, out_ch)
        else:
            self.up = nn.ConvTranspose2d(in_ch // 2, in_ch // 2, 2, stride=2)
            self.conv = DoubleConv(in_ch, out_ch)

    def forward(self, x1, x2):
        x1 = self.up(x1)

        # padding agar ukuran sama
        dy = x2.size(2) - x1.size(2)
        dx = x2.size(3) - x1.size(3)
        x1 = F.pad(x1, [dx // 2, dx - dx // 2, dy // 2, dy - dy // 2])

        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class OutConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.conv = nn.Conv2d(in_ch, out_ch, 1)

    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):
    """
    U-Net untuk segmentasi biner.

    in_channels  : jumlah channel input (3 untuk RGB)
    out_channels : jumlah channel output (1 untuk biner)
    features     : daftar fitur pada tiap level encoder
    bilinear     : True = bilinear upsample, False = transposed conv
    """

    def __init__(
        self,
        in_channels: int = 3,
        out_channels: int = 1,
        features: list[int] | None = None,
        bilinear: bool = True,
    ):
        super().__init__()

        if features is None:
            features = [64, 128, 256, 512]

        self.inc = DoubleConv(in_channels, features[0])
        self.down1 = Down(features[0], features[1])
        self.down2 = Down(features[1], features[2])
        self.down3 = Down(features[2], features[3])

        factor = 2 if bilinear else 1
        self.down4 = Down(features[3], features[3] * 2 // factor)

        self.up1 = Up(features[3] * 2, features[3] // factor, bilinear)
        self.up2 = Up(features[3], features[2] // factor, bilinear)
        self.up3 = Up(features[2], features[1] // factor, bilinear)
        self.up4 = Up(features[1], features[0], bilinear)
        self.outc = OutConv(features[0], out_channels)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)

        return self.outc(x)


# ============================================================
# UNET WITH PRETRAINED RESNET ENCODER
# ============================================================

_RESNET_CFG = {
    "resnet18":  {"factory": models.resnet18,  "weights": models.ResNet18_Weights.DEFAULT,  "skips": [64,  64,  128,  256],  "bottle": 512},
    "resnet34":  {"factory": models.resnet34,  "weights": models.ResNet34_Weights.DEFAULT,  "skips": [64,  64,  128,  256],  "bottle": 512},
    "resnet50":  {"factory": models.resnet50,  "weights": models.ResNet50_Weights.DEFAULT,  "skips": [64,  256, 512,  1024], "bottle": 2048},
    "resnet101": {"factory": models.resnet101, "weights": models.ResNet101_Weights.DEFAULT, "skips": [64,  256, 512,  1024], "bottle": 2048},
}


class UNetResNet(nn.Module):
    """
    UNet dengan encoder ResNet pretrained (ImageNet).
    Mendukung: resnet18, resnet34, resnet50, resnet101
    Output: (B, 1, H, W) logit
    """

    def __init__(self, backbone: str = "resnet34", pretrained: bool = True, out_channels: int = 1):
        super().__init__()

        cfg = _RESNET_CFG[backbone]
        sk  = cfg["skips"]
        bot = cfg["bottle"]

        base = cfg["factory"](weights=cfg["weights"] if pretrained else None)

        # Encoder
        self.stage0 = nn.Sequential(base.conv1, base.bn1, base.relu)  # 64,   H/2
        self.pool   = base.maxpool                                      #       H/4
        self.stage1 = base.layer1                                       # sk[1],H/4
        self.stage2 = base.layer2                                       # sk[2],H/8
        self.stage3 = base.layer3                                       # sk[3],H/16
        self.stage4 = base.layer4                                       # bot,  H/32

        # Decoder blocks (setelah upsample + concat skip)
        self.dec4 = DoubleConv(bot   + sk[3], 256)
        self.dec3 = DoubleConv(256   + sk[2], 128)
        self.dec2 = DoubleConv(128   + sk[1], 64)
        self.dec1 = DoubleConv(64    + sk[0], 32)

        self.outc = OutConv(32, out_channels)

    @staticmethod
    def _up_cat(x: torch.Tensor, skip: torch.Tensor, block: nn.Module) -> torch.Tensor:
        x = F.interpolate(x, size=skip.shape[2:], mode="bilinear", align_corners=True)
        x = torch.cat([x, skip], dim=1)
        return block(x)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h, w = x.shape[2], x.shape[3]

        s0 = self.stage0(x)    # 64,   H/2
        p  = self.pool(s0)     #       H/4
        s1 = self.stage1(p)    # sk[1],H/4
        s2 = self.stage2(s1)   # sk[2],H/8
        s3 = self.stage3(s2)   # sk[3],H/16
        s4 = self.stage4(s3)   # bot,  H/32

        d = self._up_cat(s4, s3, self.dec4)   # H/16
        d = self._up_cat(d,  s2, self.dec3)   # H/8
        d = self._up_cat(d,  s1, self.dec2)   # H/4
        d = self._up_cat(d,  s0, self.dec1)   # H/2

        d = F.interpolate(d, size=(h, w), mode="bilinear", align_corners=True)  # H
        return self.outc(d)
