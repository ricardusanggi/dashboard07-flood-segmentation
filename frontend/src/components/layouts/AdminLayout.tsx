// frontend/src/components/layouts/AdminLayout.tsx
import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Database,
  Layers,
  Users,
  Box,
  Cpu,
  Menu,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../../store/useAuth";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  /* ================= SIDEBAR COLLAPSE ================= */
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("admin-sidebar");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("admin-sidebar", JSON.stringify(collapsed));
  }, [collapsed]);

  /* ================= DARK MODE ================= */
  const [dark, setDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  /* ================= MENU ================= */

  const menu = [
    { name: "Dashboard", icon: Home, to: "/admin" },
    { name: "Dataset Banjir", icon: Database, to: "/admin/datasets" },
    { name: "Pelatihan Model", icon: Layers, to: "/admin/training" },
    { name: "Model AI", icon: Box, to: "/admin/models" },
    { name: "Pengguna", icon: Users, to: "/admin/users" },
    { name: "System", icon: AlertTriangle, to: "/admin/system-reset" }
  ];

  const logout = () => {
    const confirmLogout = window.confirm(
      "Apakah Anda yakin ingin keluar dari sistem?"
    );
    if (!confirmLogout) return;

    authLogout();
    navigate("/");
  };

  return (
    <div
      className={`min-h-screen flex ${
        dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
          ${collapsed ? "w-20" : "w-64"}
          transition-all duration-300 ease-in-out
          ${dark ? "bg-slate-900" : "bg-white"}
          border-r border-slate-200 dark:border-slate-800
          flex flex-col
        `}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between px-5 py-6">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
              <Cpu className="w-5 h-5 text-white" />
            </div>

            {!collapsed && (
              <div>
                <div className="font-bold text-lg tracking-tight">
                  Deteksi Banjir
                </div>
                <div className="text-xs text-blue-400 font-semibold">
                  Admin Panel
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* MENU */}

        <nav className="flex flex-col gap-2 px-3">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  `
                  flex items-center
                  ${collapsed ? "justify-center h-12" : "gap-3 px-4 h-12"}
                  rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }
                `
                }
              >
                <Icon className="w-5 h-5" />

                {!collapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* LOGOUT */}

        <div className="mt-auto px-3 pb-6">
          <button
            onClick={logout}
            className={`
              w-full h-12 rounded-xl
              flex items-center justify-center
              ${collapsed ? "" : "gap-2"}
              bg-red-500/10 hover:bg-red-500/20
              text-red-500 font-medium transition
            `}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && "Logout"}
          </button>

          {!collapsed && (
            <div className="mt-5 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Deteksi Banjir —
              Sistem Segmentasi Citra Banjir
            </div>
          )}
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="flex-1 min-h-screen overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}