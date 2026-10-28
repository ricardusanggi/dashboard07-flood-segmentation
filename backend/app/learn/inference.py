# backend/learn/inference.py
import torch
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms

def predict_image(model, image_path, device, class_names, img_size=(224,224)):
    transform = transforms.Compose([
        transforms.Resize(img_size),
        transforms.ToTensor()
    ])

    img = Image.open(image_path).convert("RGB")
    x = transform(img).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        logits = model(x)
        probs = F.softmax(logits, dim=1)[0]

    idx = probs.argmax().item()
    return {
        "label": class_names[idx],
        "confidence": float(probs[idx])
    }
