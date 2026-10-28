#!/bin/bash
# sync_model_to_worker.sh
# Jalankan setelah model baru di-approve di backend.
# Menyalin model.pth dan class_mapping.json ke worker node.

WORKER_HOST="10.8.0.3"
WORKER_PORT="2222"
WORKER_USER="sembarangwsl"
WORKER_PASS="130686"
MODEL_SRC="/opt/flood_segmentation/storage/models_predict"
MODEL_DEST="/opt/flood_segmentation/storage/models_predict"

echo "[SYNC] Menyalin model ke worker $WORKER_HOST..."

sshpass -p "$WORKER_PASS" ssh -p "$WORKER_PORT" \
    -o StrictHostKeyChecking=no \
    "$WORKER_USER@$WORKER_HOST" \
    "echo '$WORKER_PASS' | sudo -S mkdir -p $MODEL_DEST"

sshpass -p "$WORKER_PASS" scp -P "$WORKER_PORT" \
    -o StrictHostKeyChecking=no \
    "$MODEL_SRC/model.pth" \
    "$WORKER_USER@$WORKER_HOST:$MODEL_DEST/model.pth"

if [ -f "$MODEL_SRC/class_mapping.json" ]; then
    sshpass -p "$WORKER_PASS" scp -P "$WORKER_PORT" \
        -o StrictHostKeyChecking=no \
        "$MODEL_SRC/class_mapping.json" \
        "$WORKER_USER@$WORKER_HOST:$MODEL_DEST/class_mapping.json"
fi

if [ -f "$MODEL_SRC/training_artifact.json" ]; then
    sshpass -p "$WORKER_PASS" scp -P "$WORKER_PORT" \
        -o StrictHostKeyChecking=no \
        "$MODEL_SRC/training_artifact.json" \
        "$WORKER_USER@$WORKER_HOST:$MODEL_DEST/training_artifact.json"
fi

if [ -f "$MODEL_SRC/model_info.json" ]; then
    sshpass -p "$WORKER_PASS" scp -P "$WORKER_PORT" \
        -o StrictHostKeyChecking=no \
        "$MODEL_SRC/model_info.json" \
        "$WORKER_USER@$WORKER_HOST:$MODEL_DEST/model_info.json"
fi

echo "[SYNC] Selesai."
