//path: frontend/src/pages/admin/types/userTypes.ts
export type Role = "admin" | "registered" | "public";

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: Role;
  created_at?: string; // ✅ tanggal user bergabung

};

export type UserStats = {
  total: number;
  admin: number;
  registered: number;
  public: number;
};
