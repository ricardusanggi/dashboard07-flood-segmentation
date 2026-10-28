# backend/app/learn/segmentation_methods.py
#
# Implementasi metode segmentasi klasik berbasis OpenCV.
# Setiap fungsi menerima np.ndarray (H,W,3) uint8 dan
# mengembalikan binary mask (H,W) uint8 dengan nilai 0 atau 255.

import cv2
import numpy as np


# ============================================================
# HELPER MORPHOLOGI
# ============================================================

def _apply_morph(mask: np.ndarray, kernel_size: int, iterations: int) -> np.ndarray:
    if kernel_size <= 0 or iterations <= 0:
        return mask
    k = np.ones((kernel_size, kernel_size), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k, iterations=iterations)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=iterations)
    return mask


# ============================================================
# OTSU THRESHOLDING
# ============================================================

def apply_otsu(image: np.ndarray, params: dict) -> np.ndarray:
    """
    Konversi ke grayscale → Gaussian blur → threshold Otsu.
    params: morph_kernel, morph_iterations
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, mask = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    mask = _apply_morph(
        mask,
        params.get("morph_kernel", 3),
        params.get("morph_iterations", 1),
    )
    return mask


# ============================================================
# ADAPTIVE THRESHOLDING
# ============================================================

def apply_adaptive(image: np.ndarray, params: dict) -> np.ndarray:
    """
    Adaptive mean / Gaussian threshold.
    params: adaptive_block (harus ganjil >= 3), adaptive_c, morph_kernel, morph_iterations
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    block = params.get("adaptive_block", 11)
    if block % 2 == 0:
        block += 1
    block = max(3, block)

    c = params.get("adaptive_c", 2)

    mask = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block,
        c,
    )
    mask = _apply_morph(
        mask,
        params.get("morph_kernel", 3),
        params.get("morph_iterations", 1),
    )
    return mask


# ============================================================
# WATERSHED
# ============================================================

def apply_watershed(image: np.ndarray, params: dict) -> np.ndarray:
    """
    Segmentasi Watershed berbasis distance transform.
    params: morph_kernel, morph_iterations
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)

    sure_bg = cv2.dilate(opening, kernel, iterations=3)

    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
    _, sure_fg = cv2.threshold(dist_transform, 0.7 * dist_transform.max(), 255, 0)
    sure_fg = np.uint8(sure_fg)

    unknown = cv2.subtract(sure_bg, sure_fg)

    _, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0

    img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    markers = cv2.watershed(img_bgr, markers)

    mask = np.zeros(gray.shape, dtype=np.uint8)
    mask[markers > 1] = 255

    mask = _apply_morph(
        mask,
        params.get("morph_kernel", 3),
        params.get("morph_iterations", 1),
    )
    return mask


# ============================================================
# K-MEANS CLUSTERING
# ============================================================

def apply_kmeans(image: np.ndarray, params: dict) -> np.ndarray:
    """
    Segmentasi K-Means pada ruang warna.
    params: kmeans_k (jumlah cluster), morph_kernel, morph_iterations
    """
    k = max(2, params.get("kmeans_k", 3))

    Z = image.reshape((-1, 3)).astype(np.float32)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    _, labels, centers = cv2.kmeans(Z, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

    centers = centers.astype(np.uint8)
    segmented = centers[labels.flatten()].reshape(image.shape)

    gray_seg = cv2.cvtColor(segmented, cv2.COLOR_RGB2GRAY)

    # pilih cluster foreground = yang paling terang
    cluster_brightness = [
        float(np.mean(gray_seg[labels.reshape(image.shape[:2]) == c]))
        for c in range(k)
    ]
    fg_label = int(np.argmax(cluster_brightness))

    fg_mask = (labels.reshape(image.shape[:2]) == fg_label).astype(np.uint8) * 255

    fg_mask = _apply_morph(
        fg_mask,
        params.get("morph_kernel", 3),
        params.get("morph_iterations", 1),
    )
    return fg_mask


# ============================================================
# DISPATCHER UTAMA
# ============================================================

def apply_segmentation(
    image: np.ndarray,
    method: str,
    params: dict,
) -> np.ndarray:
    """
    Menjalankan metode segmentasi yang dipilih.

    image  : np.ndarray (H, W, 3) uint8 RGB
    method : "otsu" | "adaptive" | "watershed" | "kmeans"
    params : dict parameter dari .env

    Returns
    -------
    mask : np.ndarray (H, W) uint8, nilai 0 atau 255
    """
    method = method.lower()

    if method == "otsu":
        return apply_otsu(image, params)

    if method == "adaptive":
        return apply_adaptive(image, params)

    if method == "watershed":
        return apply_watershed(image, params)

    if method == "kmeans":
        return apply_kmeans(image, params)

    raise ValueError(f"Metode segmentasi tidak dikenal: {method}")


# ============================================================
# OVERLAY VISUALISASI
# ============================================================

def overlay_mask_on_image(
    image: np.ndarray,
    mask: np.ndarray,
    color: tuple[int, int, int] = (0, 255, 0),
    alpha: float = 0.4,
) -> np.ndarray:
    """
    Menggabungkan gambar asli dengan mask sebagai overlay transparan.

    image : (H, W, 3) uint8 RGB
    mask  : (H, W) uint8, 0 / 255
    color : warna overlay RGB
    alpha : transparansi overlay (0 = tidak terlihat, 1 = solid)
    """
    overlay = image.copy()
    fg = mask > 0
    for c, val in enumerate(color):
        overlay[:, :, c] = np.where(fg, overlay[:, :, c] * (1 - alpha) + val * alpha, overlay[:, :, c])
    return np.clip(overlay, 0, 255).astype(np.uint8)
