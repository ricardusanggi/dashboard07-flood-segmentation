# FloodSeg AI — Dashboard Web

Dashboard web untuk sistem segmentasi citra banjir berbasis Deep Learning. Dibangun dengan React 18 + TypeScript + Vite + TailwindCSS.

---

## Tech Stack

| Teknologi | Versi | Kegunaan |
| --- | --- | --- |
| React | 18 | UI framework |
| TypeScript | 5+ | Type safety |
| Vite | 6+ | Build tool & dev server |
| TailwindCSS | 3+ | Styling |
| Recharts | 2+ | Grafik training (loss, metrik) |
| Axios | 1+ | HTTP client ke backend |
| Lucide React | — | Ikon |

---

## Struktur Direktori

```text
src/
├── api/
│   ├── api.ts                  # Axios instance + interceptor JWT
│   ├── users.ts                # API user, dataset, prediksi
│   └── adminDataset.ts         # API admin dataset
├── components/
│   ├── ui/                     # Card, Section, dll.
│   └── Spinner.tsx
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx        # Form registrasi + validasi password
│   │   └── RegisterView.tsx
│   ├── admin/
│   │   ├── AdminDatasetPage.tsx          # Orchestrator halaman dataset
│   │   ├── AdminDatasetPageViewHistory.tsx   # Riwayat & preview dataset
│   │   ├── AdminDatasetPageViewPending.tsx   # Review & approve dataset
│   │   ├── AdminDatasetPageViewMerge.tsx     # Merge dataset ke training pool
│   │   ├── AdminDatasetPageViewUpload.tsx    # Upload dataset ZIP
│   │   └── types/datasetTypes.ts
│   └── user/
│       ├── DashboardUserViewDataset.tsx  # Upload dataset kontributor
│       └── DashboardUserViewHistory.tsx  # Riwayat prediksi segmentasi
└── ...
```

---

## Setup & Menjalankan

### Prasyarat

- Node.js 18+
- Backend API berjalan di port `8007`

### Development

```bash
npm install
npm run dev
# http://localhost:3007
```

### Production Build

```bash
npm run build
# Output di dist/
```

### Konfigurasi

Buat file `.env` di folder ini:

```env
VITE_API_URL=http://localhost:8007
```

Sesuaikan URL dengan IP/hostname server backend.

---

## Fitur

### Publik (tanpa login)

- Lihat metrik model aktif (IoU, Dice, Pixel Accuracy)
- Lihat info arsitektur model

### User Terdaftar

- Upload dataset segmentasi banjir (file `.zip` berisi `images/` + `masks/`)
- Lihat riwayat prediksi segmentasi beserta metode yang digunakan

### Admin

| Halaman | Fitur |
| --- | --- |
| Dataset | Upload dataset, review pending, approve/reject, merge ke training pool |
| Training | Mulai training baru (U-Net / DeepLabV3+), pantau progress per epoch |
| Model | Daftar model, set model aktif, rollback, lihat metrik & preview segmentasi |
| Users | Manajemen user, approve akun registered |

---

## Autentikasi

- JWT Bearer token disimpan di `localStorage`
- Otomatis di-attach ke setiap request via Axios interceptor
- Auto-logout saat token expired (respons `401`)
- Endpoint `/auth/*` dan `/public/*` dikecualikan dari auto-logout

---

## Validasi Password

Aturan yang sama dengan backend:

- Minimal 8 karakter
- Minimal 1 huruf kapital
- Minimal 1 huruf kecil
- Minimal 1 angka
- Minimal 1 karakter spesial (`!@#$%^&*...`)

---

## Preview Dataset Segmentasi

Halaman preview dataset menampilkan **pasangan citra asli dan mask** secara berdampingan (bukan per-label seperti klasifikasi). Setiap card menampilkan:

```text
┌──────────────┬──────────────┐
│  Citra Asli  │     Mask     │
│   (images/)  │   (masks/)   │
└──────────────┴──────────────┘
  nama_file.jpg
```
