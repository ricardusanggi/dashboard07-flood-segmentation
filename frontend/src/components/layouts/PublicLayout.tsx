//  frontend/src/components/layouts/PublicLayout.tsx
import PublicNavbar from "../navbar/PublicNavbar";

interface PublicLayoutProps {
  children: React.ReactNode;
  navbar?: boolean; // tampilkan navbar publik
  container?: boolean; // gunakan container atau full width
  background?: string; // background custom (default: Deteksi Banjir theme)
}

export default function PublicLayout({
  children,
  navbar = true,
  container = false,
  background = "bg-gradient-to-b from-yellow-50 to-white dark:from-slate-900 dark:to-slate-950"
}: PublicLayoutProps) {
  return (
    <div className={`min-h-screen ${background}`}>
      {/* Navbar Publik */}
      {navbar && <PublicNavbar />}

      {/* Konten Halaman */}
      <div className={container ? "container mx-auto py-6 px-4" : ""}>
        {children}
      </div>
    </div>
  );
}