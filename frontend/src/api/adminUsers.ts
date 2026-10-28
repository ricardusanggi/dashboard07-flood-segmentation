//path: frontend/src/api/adminUsers.ts
import api from "./api";

export const adminUsersApi = {
  // ============================
  // LIST ALL USERS
  // ============================
  //list: () => api.get("/admin/users"),
  list: (search?: string, signal?: AbortSignal) =>
    api.get("/admin/users", {
      params: search ? { search } : {},
      signal
    }),
  // ============================
  // UPDATE USER
  // ============================
  update: (id: number, payload: any) => api.put(`/admin/${id}`, payload),

  // ============================
  // DELETE USER
  // ============================
  delete: (id: number) => api.delete(`/admin/${id}`),

  // ============================
  // VERIFY USER (PUBLIC → REGISTERED)
  // ============================
  verify: (id: number) => api.post(`/admin/verify-user/${id}`)
};
