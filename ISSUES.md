# Daftar Masalah yang Harus Diperbaiki

> Terakhir diperbarui: 2026-05-28

---

## 🔴 KRITIS

### 1. `training_artifact.json` tidak di-copy ke `models_predict/` setelah approve
- **File:** `backend/app/services/public_service.py:36` + `backend/app/services/training_service.py`
- **Dampak:** `/public/model-info` terus return 409 meski model sudah di-training & approve
- **Fix:** Copy `training_artifact.json` dari `models_train/run_{job_id}/` ke `models_predict/` saat admin approve training

### 2. `model.pth` tidak di-copy ke predict dir setelah approval
- **File:** `backend/app/services/model_service.py:179`
- **Dampak:** Inference gagal meski training berhasil
- **Fix:** Pastikan `copy_model_to_predict_dir()` dipanggil dengan path yang benar saat approve

### 3. Error upload 400 tidak informatif
- **File:** `backend/app/services/dataset_service.py:106-116`
- **Dampak:** User tidak tahu file mana yang tidak cocok antara `images/` dan `masks/`
- **Fix:** Tampilkan nama file yang tidak match di pesan error

---

## 🟠 SERIUS

### 4. Frontend IP di-hardcode
- **File:** `frontend/.env`
- **Dampak:** `VITE_API_URL=http://10.8.0.6:8007` rusak jika IP berubah
- **Fix:** Gunakan relative URL `/api` dan proxy via nginx

### 5. Training task tidak ada timeout
- **File:** `backend/app/routes/training_routes.py:73`
- **Dampak:** Jika training stuck, `training_global_lock` tidak pernah release → sistem terkunci permanen
- **Fix:** Tambah timeout + admin endpoint untuk force-stop training

### 6. Absolute path dataset tersimpan di DB
- **File:** `backend/app/services/dataset_service.py:283`
- **Dampak:** Jika container di-restart dengan mount berbeda, approval dataset akan gagal
- **Fix:** Simpan relative path — util `to_relative_app_path()` sudah ada, tinggal dipakai konsisten

### 7. Worker node tidak bisa pull image dari registry secara permanen
- **File:** `docker-stack.yml:21`
- **Dampak:** Saat container pindah ke worker node, gagal pull image
- **Fix:** Setup `insecure-registries` permanen di `/etc/docker/daemon.json` worker via `systemctl restart docker` (bukan hanya HUP)

---

## 🟡 PENTING

### 8. Race condition pada penomoran versi model
- **File:** `backend/app/services/training_service.py:414`
- **Dampak:** Dua approval bersamaan bisa buat versi duplikat di DB
- **Fix:** Gunakan `SELECT ... FOR UPDATE` atau database sequence

### 9. Preview dataset bisa hang untuk dataset besar
- **File:** `backend/app/routes/dataset_routes_admin.py:258`
- **Dampak:** `iterdir()` tanpa limit pada folder besar bisa timeout/crash
- **Fix:** Batasi scan maksimal misal 1000 file

### 10. Tidak ada pengecekan sisa disk space sebelum upload
- **File:** `backend/app/routes/dataset_routes.py:62`
- **Dampak:** Disk bisa penuh tanpa peringatan → sistem crash
- **Fix:** Cek `shutil.disk_usage()` sebelum terima upload

### 11. Error message tidak konsisten (campur Indonesia & English)
- **File:** `backend/app/routes/dataset_routes.py:54` vs `backend/app/services/dataset_service.py:92`
- **Dampak:** Membingungkan user
- **Fix:** Standarisasi ke satu bahasa (Indonesia)

---

## 🟢 MINOR

### 12. `Lock.locked()` tidak reliable untuk cek status training
- **File:** `backend/app/services/training_service.py:464`
- **Dampak:** Frontend bisa tampilkan status training yang salah
- **Fix:** Andalkan DB flag saja, buang `training_global_lock.locked()`

### 13. Tidak ada request ID di log error
- **File:** `backend/app/routes/dataset_routes.py:98`
- **Dampak:** Susah trace error dari frontend ke backend log
- **Fix:** Tambah middleware request ID

### 14. Tidak ada audit trail untuk approval dataset/model
- **File:** `backend/app/routes/dataset_routes_admin.py:77`
- **Dampak:** Tidak bisa tahu siapa approve apa dan kapan
- **Fix:** Tambah tabel log approval

---

## Urutan Prioritas Pengerjaan

1. Fix flow approve training → copy `model.pth` + `training_artifact.json` ke predict dir (isu #1, #2)
2. Fix error message upload dataset agar informatif (isu #3)
3. Fix absolute path dataset di DB → relative path (isu #6)
4. Tambah timeout untuk training task (isu #5)
5. Fix frontend hardcoded IP (isu #4)
6. Fix worker node registry pull permanen (isu #7)
