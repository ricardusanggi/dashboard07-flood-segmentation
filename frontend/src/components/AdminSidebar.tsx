// frontend/src/components/AdminSidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Cpu, Layers, Users } from "lucide-react";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Dataset", icon: Database, to: "/admin/datasets" },
  { label: "Training", icon: Cpu, to: "/admin/training" },
  { label: "Models", icon: Layers, to: "/admin/models" },
  { label: "Kelola User", icon: Users, to: "/admin/users" }
];

export default function Sidebar({ open }: { open: boolean }) {
  const location = useLocation();

  // /admin → ""
  // /admin/training → "training"
  const currentSegment = location.pathname.split("/")[2] || "";

  return (
    <aside
      className={`
        h-screen sticky top-0
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${open ? "w-64" : "w-20"}
      `}
    >
      {/* BRAND / LOGO */}
      <div
        className={`
          h-16 flex items-center justify-center
          border-b border-gray-200
          font-extrabold tracking-wide
          text-blue-600
        `}
      >
        {open ? "ADMIN PANEL" : "AP"}
      </div>

      {/* MENU */}
      <nav className="p-3 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          const segment = item.to.split("/")[2] || "";
          const isActive = currentSegment === segment;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                group relative flex items-center
                ${open ? "gap-3 px-4" : "justify-center"}
                py-3 rounded-xl
                transition-all duration-200
                ${
                  isActive
                    ? `
                      bg-gradient-to-r from-blue-600 to-indigo-600
                      text-white shadow-md
                    `
                    : `
                      text-gray-700 hover:bg-gray-100
                    `
                }
              `}
            >
              {/* ICON */}
              <Icon
                size={20}
                className={`
                  transition-colors
                  ${isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600"}
                `}
              />

              {/* LABEL */}
              {open && (
                <span
                  className={`
                    text-sm
                    ${isActive ? "font-semibold text-white" : "font-medium"}
                  `}
                >
                  {item.label}
                </span>
              )}

              {/* ACTIVE INDICATOR (collapsed mode) */}
              {!open && isActive && (
                <span className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
