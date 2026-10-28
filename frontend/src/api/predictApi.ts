// frontend/src/api/predictApi.ts

import axios from "axios";

// Instance primary dengan timeout agar bisa fallback saat manager tidak merespons
const predictPrimary = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000, // 15 detik — cukup untuk cold start, cepat untuk detect mati
});
// Salin token dari localStorage seperti api.ts
predictPrimary.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Instance fallback langsung ke worker predict (tidak perlu auth — public endpoint)
const predictFallback = axios.create({
  baseURL: import.meta.env.VITE_PREDICT_FALLBACK_URL,
  timeout: 120_000,
});

// Kirim request ke primary, fallback ke worker jika primary tidak merespons
async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await primary();
  } catch (err: any) {
    // Hanya fallback saat network error atau 502/503/504 (gateway/manager mati)
    const status = err?.response?.status;
    if (err?.response && status !== 502 && status !== 503 && status !== 504) {
      throw err;
    }
    if (!import.meta.env.VITE_PREDICT_FALLBACK_URL) throw err;
    console.warn("[predictApi] Primary tidak merespons, fallback ke worker predict…");
    return await fallback();
  }
}

/* ===============================
   SEGMENTASI GAMBAR
   file : citra asli (wajib)
   mask : mask ground-truth (opsional, untuk evaluasi IoU/Dice)
================================ */

export async function segmentImage(file: File, mask?: File | null) {
  function buildForm() {
    const form = new FormData();
    form.append("file", file);
    if (mask) form.append("mask", mask);
    return form;
  }

  return withFallback(
    () => predictPrimary.post("/predict/upload-image-testing", buildForm()).then((r) => r.data),
    () => predictFallback.post("/predict/upload-image-testing", buildForm()).then((r) => r.data),
  );
}

/* ===============================
   INFO METODE SEGMENTASI AKTIF
================================ */

export async function getSegmentationMethodInfo() {
  return withFallback(
    () => predictPrimary.get("/predict/method-info").then((r) => r.data),
    () => predictFallback.get("/predict/method-info").then((r) => r.data),
  );
}
