# path: backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# install dependency system (optional tapi sering dibutuhkan ML)
RUN apt-get update && apt-get install -y \
    gcc \
    libglib2.0-0 \
    libgl1 \
    sshpass \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# copy requirements
COPY requirements.txt .

# install python packages
RUN pip install --no-cache-dir -r requirements.txt

# copy source code
COPY . .

# expose port
EXPOSE 8007

RUN mkdir -p \
    storage/databases \
    storage/models_train \
    storage/models_predict \
    storage/models_upload \
    storage/models_reject \
    storage/datasets_train \
    storage/datasets_pending \
    storage/datasets_reject \
    storage/datasets_test \
    storage/logs
    
# run server
# --timeout 300  : beri waktu 5 menit untuk upload file besar
# --limit-request-line 0 --limit-request-fields 0 --limit-request-field-size 0 : hapus batas ukuran request
CMD ["gunicorn", "app.main:app", \
    "-k", "uvicorn.workers.UvicornWorker", \
    "-w", "1", \
    "-b", "0.0.0.0:8007", \
    "--timeout", "300" ]