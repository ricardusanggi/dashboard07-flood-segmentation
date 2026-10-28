#!/bin/bash
# run.sh — Setup & jalankan flood segmentation dari nol hingga Swarm aktif
# Usage: bash run.sh

set -e

REGISTRY="10.8.0.6:5007"
STACK="dashboard07-flood-segmentation"
STORAGE="/opt/flood_segmentation/storage"
WORKER_HOST="10.8.0.3"
WORKER_PORT="2222"
WORKER_USER="sembarangwsl"
WORKER_PASS="130686"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

cd "$(dirname "$0")"

# ============================================================
# 1. BERSIHKAN STATE LAMA
# ============================================================
log "Membersihkan container dan stack lama..."
docker compose down 2>/dev/null || true
docker stack rm "$STACK" 2>/dev/null || true
sleep 8

# ============================================================
# 2. RESET STORAGE
# ============================================================
log "Mereset storage..."

# Storage Swarm (dipakai oleh docker stack)
sudo rm -rf "$STORAGE"
sudo mkdir -p \
  "$STORAGE/databases" \
  "$STORAGE/models_train" \
  "$STORAGE/models_predict" \
  "$STORAGE/models_upload" \
  "$STORAGE/models_reject" \
  "$STORAGE/datasets_train" \
  "$STORAGE/datasets_pending" \
  "$STORAGE/datasets_reject" \
  "$STORAGE/datasets_test" \
  "$STORAGE/datasets_test_true" \
  "$STORAGE/logs"
sudo chown -R "$(whoami):$(whoami)" "$STORAGE"

# Storage lokal backend (sisa dari docker compose / container lama)
sudo rm -rf backend/storage
mkdir -p backend/storage/{databases,models_train,models_predict,models_upload,models_reject,datasets_train,datasets_pending,datasets_reject,datasets_test,datasets_test_true,logs}

log "Storage bersih"

# ============================================================
# 3. SETUP STORAGE DI WORKER NODE
# ============================================================
log "Mereset storage worker node ($WORKER_HOST)..."
sshpass -p "$WORKER_PASS" ssh -p "$WORKER_PORT" \
  -o StrictHostKeyChecking=no \
  "$WORKER_USER@$WORKER_HOST" \
  "echo '$WORKER_PASS' | sudo -S bash -c '
    rm -rf /opt/flood_segmentation/storage
    mkdir -p /opt/flood_segmentation/storage/models_predict
    chown -R $WORKER_USER:$WORKER_USER /opt/flood_segmentation
  '" && log "Storage worker bersih" || warn "Gagal setup worker storage, lanjut..."

# ============================================================
# 4. BUILD IMAGES
# ============================================================
log "Build images..."
docker compose build
docker build --network=none -t "$REGISTRY/dashboard07-flood-segmentation-gateway:latest" nginx/
log "Build selesai"

# ============================================================
# 5. TAG & PUSH KE REGISTRY
# ============================================================
log "Push images ke registry $REGISTRY..."
docker tag dashboard07-flood-segmentation-backend:latest  "$REGISTRY/dashboard07-flood-segmentation-backend:latest"
docker tag dashboard07-flood-segmentation-frontend:latest "$REGISTRY/dashboard07-flood-segmentation-frontend:latest"
docker push "$REGISTRY/dashboard07-flood-segmentation-backend:latest"
docker push "$REGISTRY/dashboard07-flood-segmentation-frontend:latest"
docker push "$REGISTRY/dashboard07-flood-segmentation-gateway:latest"
log "Push selesai"

# ============================================================
# 6. SYNC IMAGE BACKEND KE WORKER (agar predict replica bisa jalan di worker)
# ============================================================
log "Sync image backend ke worker node ($WORKER_HOST)..."
docker save "$REGISTRY/dashboard07-flood-segmentation-backend:latest" \
  | gzip \
  | sshpass -p "$WORKER_PASS" ssh -p "$WORKER_PORT" \
      -o StrictHostKeyChecking=no \
      "$WORKER_USER@$WORKER_HOST" \
      "gunzip | docker load" \
  && log "Sync image ke worker selesai" \
  || warn "Gagal sync image ke worker, predict hanya jalan di manager"

# ============================================================
# 7. DEPLOY SWARM STACK
# Tidak pakai docker compose — semua dihandle Swarm.
# Backend & gateway dikunci di manager via placement constraint.
# ============================================================
log "Deploy Swarm stack '$STACK'..."
docker stack deploy -c docker-stack.yml "$STACK"

log "Menunggu service siap..."
sleep 20

log "Status service Swarm:"
docker service ls

# ============================================================
# 8. VERIFIKASI LOGIN
# ============================================================
log "Menunggu backend siap..."
sleep 15

LOGIN=$(python3 -c "
import urllib.request, urllib.parse, sys
data = urllib.parse.urlencode({'username': 'master@segment.com', 'password': 'cardus'}).encode()
req = urllib.request.Request('http://localhost:8027/auth/token', data=data, method='POST')
req.add_header('Content-Type', 'application/x-www-form-urlencoded')
try:
    r = urllib.request.urlopen(req, timeout=20)
    print('ok' if r.status == 200 else 'fail')
except Exception as e:
    print('fail')
" 2>/dev/null)

if [ "$LOGIN" = "ok" ]; then
  log "Login via gateway berhasil ✓"
else
  warn "Gateway belum merespons — tunggu lalu cek: docker service ls"
fi

# ============================================================
# SELESAI
# ============================================================
echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}  Sistem siap!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo "  Frontend  : http://10.8.0.6:3007"
echo "  Gateway   : http://10.8.0.6:8027  (dipakai frontend)"
echo "  Backend   : http://10.8.0.6:8007  (langsung)"
echo "  Predict   : http://10.8.0.6:8017  (langsung)"
echo "  Registry  : http://10.8.0.6:5007"
echo "  Portainer : http://10.8.0.6:9000"
echo ""
echo "  Login     : master@segment.com / cardus"
echo ""
echo "  Langkah selanjutnya:"
echo "  1. Upload dataset ZIP (images/ + masks/)"
echo "  2. Approve dataset di panel admin"
echo "  3. Jalankan training"
echo "  4. Approve model hasil training"
echo "  5. bash scripts/sync_model_to_worker.sh"
echo ""
