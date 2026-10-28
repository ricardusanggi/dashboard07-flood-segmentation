// frontend/src/api/adminDataset.ts
import api from "./api";
import type {
  Pending,
  DatasetHistory,
  DatasetStats
} from "../pages/admin/types/datasetTypes";

export const adminDatasetApi = {
  // =============================
  // DATASETS
  // =============================

  listPending: () => api.get<Pending[]>("/admin/datasets/pending"),

  listAllHistory: () => api.get<DatasetHistory[]>("/admin/datasets/history"),

  approve: (logId: number) => api.post(`/admin/datasets/approve/${logId}`),

  reject: (logId: number) => api.post(`/admin/datasets/reject/${logId}`),

  cancel: (logId: number) => api.post(`/admin/datasets/cancel/${logId}`),

  // =============================
  // STATS
  // =============================

  getTrainStats: () => api.get<DatasetStats>("/admin/datasets/stats"),

  // =============================
  // PREVIEW
  // =============================

  preview: (logId: number) => api.get(`/admin/datasets/preview/${logId}`),

  previewTrain: () => api.get("/admin/datasets/preview-train"),

  file: (path: string) =>
    api.get(`/admin/datasets/file?path=${encodeURIComponent(path)}`),

  // =============================
  // TEST TRUE
  // =============================

  mergeTestTrue: () => api.post("/admin/datasets/merge-test-true"),

  getTestTrueSummary: () => api.get("/admin/datasets/test-true-summary"),

  checkDuplicates: () => api.get("/admin/datasets/duplicate-check")
};
