# path: backend/app/learn/model_classifier.py

import torch.nn as nn
from torchvision import models


class ModelClassifier(nn.Module):
    """
    Generic Image Classification Model Wrapper

    Supported architectures:
    - resnet18
    - resnet34
    - resnet50
    - mobilenet_v2
    - efficientnet_b0
    - efficientnet_b1
    - efficientnet_b2
    - densenet121
    - vgg16
    """

    def __init__(self, num_classes: int, architecture: str = "resnet18"):
        super().__init__()

        architecture = architecture.lower()

        # =========================================================
        # RESNET FAMILY
        # =========================================================
        if architecture == "resnet18":
            backbone = models.resnet18(weights=None)
            in_features = backbone.fc.in_features
            backbone.fc = nn.Linear(in_features, num_classes)

        elif architecture == "resnet34":
            backbone = models.resnet34(weights=None)
            in_features = backbone.fc.in_features
            backbone.fc = nn.Linear(in_features, num_classes)

        elif architecture == "resnet50":
            backbone = models.resnet50(weights=None)
            in_features = backbone.fc.in_features
            backbone.fc = nn.Linear(in_features, num_classes)

        # =========================================================
        # MOBILENET
        # =========================================================
        elif architecture == "mobilenet_v2":
            backbone = models.mobilenet_v2(weights=None)
            in_features = backbone.classifier[1].in_features
            backbone.classifier[1] = nn.Linear(in_features, num_classes)

        # =========================================================
        # EFFICIENTNET FAMILY
        # =========================================================
        elif architecture == "efficientnet_b0":
            backbone = models.efficientnet_b0(weights=None)
            in_features = backbone.classifier[1].in_features
            backbone.classifier[1] = nn.Linear(in_features, num_classes)

        elif architecture == "efficientnet_b1":
            backbone = models.efficientnet_b1(weights=None)
            in_features = backbone.classifier[1].in_features
            backbone.classifier[1] = nn.Linear(in_features, num_classes)

        elif architecture == "efficientnet_b2":
            backbone = models.efficientnet_b2(weights=None)
            in_features = backbone.classifier[1].in_features
            backbone.classifier[1] = nn.Linear(in_features, num_classes)

        # =========================================================
        # DENSENET
        # =========================================================
        elif architecture == "densenet121":
            backbone = models.densenet121(weights=None)
            in_features = backbone.classifier.in_features
            backbone.classifier = nn.Linear(in_features, num_classes)

        # =========================================================
        # VGG
        # =========================================================
        elif architecture == "vgg16":
            backbone = models.vgg16(weights=None)
            in_features = backbone.classifier[6].in_features
            backbone.classifier[6] = nn.Linear(in_features, num_classes)

        # =========================================================
        # ERROR
        # =========================================================
        else:
            raise ValueError(
                f"Unsupported architecture: {architecture}"
            )

        self.model = backbone
        self.architecture = architecture

    def forward(self, x):
        return self.model(x)