# backend/learn/devices.py

import torch

def auto_device(requested=None):
    """
    Convert None / "cuda" / "cpu" / "mps" / torch.device
    into a valid torch.device.
    Prefer GPU -> MPS -> CPU.
    """

    # --- explicit device instance ---
    if isinstance(requested, torch.device):
        return requested

    # --- explicit string ---
    if isinstance(requested, str) and requested.strip() != "":
        try:
            return torch.device(requested)
        except Exception as e:
            print(f"⚠ auto_device: invalid requested device '{requested}': {e}")

    # --- fallback GPU → MPS → CPU ---
    if torch.cuda.is_available():
        print("🔥 Using CUDA GPU")
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        print("🍏 Using Apple MPS")
        return torch.device("mps")
    print("⚙️ Using CPU")
    return torch.device("cpu")


def setup_model_device(model, device):
    """
    Move model to device and wrap with DataParallel if GPU >= 2.
    """
    model = model.to(device)

    if torch.cuda.is_available() and torch.cuda.device_count() > 1:
        print(f"🔥 Multi-GPU detected: {torch.cuda.device_count()} GPUs → DataParallel enabled")
        model = torch.nn.DataParallel(model, device_ids=list(range(torch.cuda.device_count())))

    return model
