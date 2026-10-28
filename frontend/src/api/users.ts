// src/api/users.ts
import api from "./api";

/* ======================================================
   USER PROFILE
   ====================================================== */
export const userMeApi = {
  getMe: () => api.get("/users/me"),

  updateMe: (data: { full_name?: string; email?: string; password?: string }) =>
    api.put("/users/me", data)
};

/* ======================================================
   DATASET UPLOAD & HISTORY
   ====================================================== */
export const usersDatasetApi = {

  listHistory: (page = 1, limit = 10, status = "") =>
    api.get("/users/datasets/history", {
      params: { page, limit, status }
    }),

  listMyPending: () => api.get("/users/datasets/pending"),

  // 🔥 TAMBAHKAN INI
  getPending: () => api.get("/users/datasets/pending"),

  upload: (file: File, onProgress?: (percent: number) => void) => {
    const fd = new FormData();
    fd.append("file", file);

    return api.post("/users/datasets/upload", fd, {
      timeout: 0,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (progressEvent) => {
        const total = progressEvent.total ?? 1;
        const percent = Math.round((progressEvent.loaded * 100) / total);
        onProgress?.(percent);
      }
    });
  },

  getOverview: () => api.get("/users/my-datasets-overview")
};

/* ======================================================
   PREDICTION HISTORY (KLASIFIKASI)
   ====================================================== */
export const userPredictionApi = {
  getMyHistory: () => api.get("/users/predictions/history")
};
