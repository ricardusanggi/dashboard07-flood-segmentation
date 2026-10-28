// frontend/src/api/adminSystem.ts
import api from "./api";

export async function resetPreview() {
  const res = await api.get("/admin/system/reset-preview");
  return res.data;
}

export async function resetSystem() {
  const res = await api.post("/system/reset");
  return res.data;
}

export async function dockerCleanup() {
  const res = await api.post("/system/docker-cleanup");
  return res.data;
}

export async function dockerDiskUsage() {
  const res = await api.get("/system/docker-disk-usage");
  return res.data;
}

export async function dockerOverview() {
  const res = await api.get("/system/docker-overview");
  return res.data.data;
}