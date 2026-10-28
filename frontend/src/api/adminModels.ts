// frontend/src/api/adminModels.ts

import api from "./api";

import type { ModelItem, ActiveModel } from "../pages/admin/types/modelTypes";

// ================= RESPONSE TYPES =================

export type UploadModelResponse = {
  detail: string;
  model_id: number;
};

export type SetActiveResponse = {
  message: string;
  active_model: number;
  version: number;
};

// ================= API FUNCTIONS =================

export const listModels = async (): Promise<ModelItem[]> => {
  const res = await api.get("/admin/models/lists");
  return res.data;
};

export const getActiveModel = async (): Promise<ActiveModel> => {
  const res = await api.get("/admin/models/active");
  return res.data;
};

export const uploadModel = async (
  name: string,
  file: File
): Promise<UploadModelResponse> => {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("file", file);

  const res = await api.post("/admin/models/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return res.data;
};

export const setActiveModel = async (modelId: number): Promise<SetActiveResponse> => {
  const res = await api.post(`/admin/models/set-active/${modelId}`);
  return res.data;
};

export const rollbackModel = async (): Promise<SetActiveResponse> => {
  const res = await api.post("/admin/models/rollback");
  return res.data;
};

// 🔥 TAMBAHAN UNTUK DISABLE ROLLBACK
export const getRollbackStatus = async (): Promise<{ available: boolean }> => {
  const res = await api.get("/admin/models/rollback-available");
  return res.data;
};
