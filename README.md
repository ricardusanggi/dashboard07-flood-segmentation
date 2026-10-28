# Flood Segmentation System

Sistem segmentasi citra banjir berbasis web menggunakan FastAPI (backend) dan React + TypeScript (frontend). Mendukung metode segmentasi klasik (OpenCV) maupun deep learning (U-Net, DeepLabV3+).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite, PyTorch, OpenCV, torchvision |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Recharts |
| Container | Docker, Docker Compose |
| Auth | JWT (Bearer token) |

---

## Struktur Direktori

```
.
├── backend/
│   ├── app/
│   │   ├── learn/              # Model & training pipeline
│   │   │   ├── model_unet.py       # U-Net encoder-decoder
│   │   │   ├── model_deeplab.py    # DeepLabV3+ (ResNet-50 backbone)
│   │   │   ├── segmentation_methods.py  # Metode klasik (Otsu, dll.)
│   │   │   ├── dataset.py          # SegmentationDataset (images/ + masks/)
│   │   │   ├── metrics.py          # IoU, Dice, Pixel Accuracy + loss fn
│   │   │   ├── trainer_epoch.py    # Loop training satu epoch
│   │   │   ├── evaluator.py        # Evaluasi validation set
│   │   │   ├── run_config.py       # Entry point training (PSO opsional)
│   │   │   └── train_main.py       # Wrapper run_training_job()
│   │   ├── routes/             # FastAPI routers
│   │   ├── services/           # Business logic
│   │   ├── utils/              # ModelManager, file helpers
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── config.py           # Pydantic Settings dari .env
│   │   └── config_training.py  # Default training params dari .env
│   ├── storage/                # Data runtime (otomatis dibuat)
│   │   ├── datasets_train/
│   │   ├── models_train/
│   │   ├── models_predict/
│   │   └── ...
│   ├── .env                    # Konfigurasi backend (wajib ada)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/          # Manajemen model & training
│   │   │   ├── user/           # Dashboard prediksi user
│   │   │   └── public/         # Halaman publik
│   │   └── api/                # Axios wrappers
│   ├── .env                    # Konfigurasi frontend
│   └── Dockerfile
├── docker-compose.yml          # Production
└── docker-compose.dev.yml      # Development
```

---

## Konfigurasi `.env`

### `backend/.env`

```env
# =====================================================
# APPLICATION
# =====================================================
ALLOWED_ORIGINS=http://localhost:3007,http://127.0.0.1:3007
DATABASE_URL=sqlite:///storage/databases/flood_segment.db
SECRET_KEY=ganti_dengan_secret_key_anda
ACCESS_TOKEN_EXPIRE_MINUTES=120
ALGORITHM=HS256

# =====================================================
# STORAGE PATHS
# =====================================================
TRAIN_DATASET_DIR=./storage/datasets_train
PENDING_DATASET_DIR=./storage/datasets_pending
REJECT_DATASET_DIR=./storage/datasets_reject
TEST_DATASET_DIR=./storage/datasets_test
TEST_TRUE_DIR=./storage/datasets_test_true
TRAIN_MODEL_DIR=./storage/models_train
UPLOAD_MODEL_DIR=./storage/models_upload
PREDICT_MODEL_DIR=./storage/models_predict
REJECT_MODEL_DIR=./storage/models_reject
LOG_DIR=./storage/logs

# =====================================================
# ML TASK
# =====================================================
CASE_DATASET=segmentation_dataset
ML_TASK=segmentation

# Pilihan: otsu | adaptive | watershed | kmeans | unet | deeplab
SEGMENTATION_METHOD=otsu

# =====================================================
# PARAMETER SEGMENTASI KLASIK
# =====================================================
SEGMENT_THRESHOLD=0.5          # Threshold biner (0.0–1.0)
SEGMENT_KMEANS_K=3             # Jumlah cluster K-Means
SEGMENT_ADAPTIVE_BLOCK=11      # Block size adaptive (harus ganjil ≥ 3)
SEGMENT_ADAPTIVE_C=2           # Konstanta C adaptive threshold
SEGMENT_MORPH_KERNEL=3         # Kernel morfologi post-processing
SEGMENT_MORPH_ITERATIONS=1     # Iterasi morfologi

# Watershed
SEGMENT_WATERSHED_MARKERS=20
SEGMENT_WATERSHED_COMPACTNESS=0.001

# =====================================================
# DEFAULT ADMIN
# =====================================================
DEFAULT_ADMIN_USERNAME=master@segment.com
DEFAULT_ADMIN_PASSWORD=ganti_password_anda
DEFAULT_ADMIN_FULLNAME=Master Admin
DEFAULT_ADMIN_EMAIL=master@segment.com
DEFAULT_ADMIN_ROLE=admin
DEFAULT_ADMIN_IS_ACTIVE=true
DEFAULT_ADMIN_IS_SUPERUSER=true

# =====================================================
# TRAINING CONFIGURATION
# =====================================================

# Arsitektur: unet | deeplab
TRAIN_ARCHITECTURE=unet

# DeepLab: gunakan pretrained ImageNet saat training baru
DEEPLAB_PRETRAINED_BACKBONE=true

TRAIN_EPOCHS=50
TRAIN_BATCH_SIZE=4
TRAIN_LEARNING_RATE=0.0001
TRAIN_OPTIMIZER=adam           # adam | sgd | adamw | rmsprop
TRAIN_LOSS_FUNCTION=bce_dice   # bce | dice | bce_dice | iou
TRAIN_AUGMENTATION=true
TRAIN_VAL_SPLIT=0.2
TRAIN_IMG_SIZE=256

# PSO (opsional, hanya untuk unet/deeplab)
USE_PSO=false
PSO_POPULATION=5
PSO_ITERS=10
PSO_EPOCHS=2
PSO_LR_MIN=0.00001
PSO_LR_MAX=0.001
PSO_DROPOUT_MIN=0.1
PSO_DROPOUT_MAX=0.5
PSO_HIDDEN_SIZES=128,256,512
PSO_BATCH_SIZES=2,4,8
PSO_AUGMENTATION=true

# =====================================================
# INFERENSI / PREDIKSI
# =====================================================
PREDICT_BATCH_SIZE=1
PREDICT_IMG_SIZE=256
PREDICT_THRESHOLD=0.5
PREDICT_AUGMENTATION=false
PREDICT_SLIDE_WINDOW_SIZE=256
PREDICT_SLIDE_WINDOW_STRIDE=128
```

### `frontend/.env`

```env
# URL backend API (sesuaikan dengan IP server)
VITE_API_URL=http://localhost:8007
```

---

## Metode Segmentasi

| Nilai `SEGMENTATION_METHOD` | Jenis | Deskripsi |
|---|---|---|
| `otsu` | Klasik | Otsu thresholding + Gaussian blur |
| `adaptive` | Klasik | Adaptive Gaussian threshold |
| `watershed` | Klasik | Watershed berbasis distance transform |
| `kmeans` | Klasik | K-Means clustering warna |
| `unet` | Deep Learning | U-Net encoder-decoder (perlu model terlatih) |
| `deeplab` | Deep Learning | DeepLabV3+ ResNet-50 dengan ASPP (perlu model terlatih) |

Metode klasik berjalan langsung tanpa model terlatih. Metode `unet` dan `deeplab` membutuhkan model yang sudah di-approve oleh admin.

### Perbandingan U-Net vs DeepLab

| Aspek | U-Net | DeepLabV3+ |
|---|---|---|
| Backbone | Custom encoder | ResNet-50 (pretrained) |
| Field of view | Terbatas (skip conn.) | Lebar (ASPP dilated conv) |
| Parameter | ~31M | ~40M |
| Training dari awal | Cepat | Lebih lama (backbone besar) |
| Transfer learning | Tidak (dari awal) | Ya (`DEEPLAB_PRETRAINED_BACKBONE=true`) |
| Cocok untuk | Dataset kecil | Dataset sedang–besar |

---

## Struktur Dataset

Upload dataset sebagai file `.zip` dengan struktur berikut:

```
dataset.zip
└── nama_folder/          (boleh bersarang)
    ├── images/
    │   ├── img001.jpg
    │   ├── img002.jpg
    │   └── ...
    └── masks/
        ├── img001.png    (binary mask, nama sama dengan images/)
        ├── img002.png
        └── ...
```

Mask harus berupa gambar grayscale biner: piksel area banjir = putih (255), background = hitam (0).

---

## Menjalankan Aplikasi

### Production (Docker)

```bash
# Build dan jalankan
docker compose up -d --build

# Frontend: http://localhost:3007
# Backend API: http://localhost:8007
# API Docs: http://localhost:8007/docs
```

### Development

```bash
# Backend (hot-reload)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload

# Frontend (hot-reload)
cd frontend
npm install
npm run dev
# Frontend: http://localhost:3007
```

### Reset Data

```bash
docker compose down -v
sudo rm -rf backend/storage/*
docker compose up -d --build
```

---

## Alur Penggunaan

### Admin

1. **Upload dataset** → ZIP dengan struktur `images/` + `masks/`
2. **Mulai training** → Pilih arsitektur (`unet` atau `deeplab`), konfigurasi hyperparameter
3. **Review hasil** → Lihat metrik IoU/Dice/Pixel Acc, preview segmentasi
4. **Approve/Reject** → Model yang di-approve otomatis menjadi aktif

### User / Publik

1. Upload **citra banjir** (wajib)
2. Upload **mask ground-truth** (opsional, untuk kalkulasi metrik)
3. Lihat hasil: tab **Overlay**, **Mask**, **Citra Asli**
4. Metrik IoU / Dice / Pixel Accuracy ditampilkan jika mask diunggah

---

## API Endpoints Utama

| Method | Path | Deskripsi |
|---|---|---|
| `POST` | `/predict/upload-image-testing` | Segmentasi gambar banjir |
| `GET` | `/predict/method-info` | Info metode aktif |
| `GET` | `/public/model-info` | Info model aktif (publik) |
| `GET` | `/admin/training/jobs` | Daftar training jobs |
| `POST` | `/admin/train` | Mulai training baru |
| `POST` | `/admin/review-approve/{id}` | Approve training job |
| `POST` | `/admin/review-reject/{id}` | Reject training job |
| `GET` | `/admin/training/metrics/{id}` | Metrik per epoch |
| `GET` | `/admin/training/preview/{id}` | Preview sampel segmentasi |

Dokumentasi interaktif: `http://localhost:8007/docs`

---

## Metrik Evaluasi

| Metrik | Rentang | Interpretasi |
|---|---|---|
| **IoU** (Intersection over Union) | 0–1 | ≥0.7 = baik |
| **Dice** (F1 segmentasi) | 0–1 | ≥0.8 = baik |
| **Pixel Accuracy** | 0–1 | Proporsi piksel benar |

Loss function yang tersedia: `bce`, `dice`, `bce_dice` (default), `iou`.
