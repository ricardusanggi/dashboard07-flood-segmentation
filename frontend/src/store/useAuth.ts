//path : frontend/src/store/useAuth.ts
import { create } from "zustand";
import api from "../api/api";

export type Role = "public" | "registered" | "admin";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  role: Role | null;
  loading: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  fetchProfile: () => Promise<boolean>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  // ================= LOGIN =================
  login: async (username: string, password: string) => {

    try {

      const params = new URLSearchParams();

      params.append("grant_type", "password"); // 🔥 WAJIB untuk OAuth2
      params.append("username", username);
      params.append("password", password);

      const res = await api.post("/auth/token", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const token = res.data.access_token;

      if (!token) {
        set({
          user: null,
          role: null,
          loading: false
        });
        return false;
      }

      // simpan token
      localStorage.setItem("token", token);

      // ambil profile user
      const ok = await useAuth.getState().fetchProfile();

      return ok;

    } catch (err) {

      console.error("Login failed:", err);

      set({
        user: null,
        role: null,
        loading: false
      });

      return false;
    }

  },


  // ================= FETCH PROFILE =================
  fetchProfile: async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      set({
        user: null,
        role: null,
        loading: false
      });
      return false;
    }

    try {

      const res = await api.get("/users/me");

      set({
        user: res.data,
        role: res.data.role,
        loading: false
      });

      return true;

    } catch (err) {

      localStorage.removeItem("token");

      set({
        user: null,
        role: null,
        loading: false
      });

      return false;

    }

  },

  // ================= LOGOUT (CLEAN) =================
  logout: () => {
    localStorage.removeItem("token");

    set({
      user: null,
      role: null,
      loading: false
    });
  },

  setUser: (user) => set({ user })
}));
