//path:  frontend/src/pages/auth/Login.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../store/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { LockKeyhole, User, Droplets, AlertCircle, ArrowLeft } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const auth = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<"wrong_password" | null>(null);
  const [lowPerformance, setLowPerformance] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      if (mediaQuery.matches || reducedMotion.matches) {
        setLowPerformance(true);
      } else {
        setLowPerformance(false);
      }
    };

    update();

    mediaQuery.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  async function login() {
    if (loading) return;

    setLoading(true);
    setErrorType(null);

    const success = await auth.login(username, password);

    setLoading(false);

    if (!success) {
      await new Promise((r) => setTimeout(r, 800));
      setErrorType("wrong_password");
    }
  }

  useEffect(() => {

    if (auth.loading) return;

    if (auth.role === "admin") {
      nav("/admin", { replace: true });
      return;
    }

    if (auth.role === "registered") {
      nav("/dashboard", { replace: true });
      return;
    }

  }, [auth.role, auth.loading, nav]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-700 relative overflow-hidden">

      {!lowPerformance && (
        <>
          <div className="absolute w-[650px] h-[650px] bg-blue-500/20 blur-[140px] rounded-full top-[-200px] left-[-200px]" />
          <div className="absolute w-[550px] h-[550px] bg-cyan-500/20 blur-[140px] rounded-full bottom-[-200px] right-[-200px]" />
        </>
      )}

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
      >
        <ArrowLeft size={18} />
        Kembali ke Beranda
      </Link>

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-white">

        <div className="flex items-center justify-center gap-3 mb-4">
          <Droplets className="w-8 h-8 text-cyan-300" />
          <h2 className="text-3xl font-bold tracking-wide text-center">
            Sistem Deteksi Banjir
          </h2>
        </div>

        <p className="text-center text-sm text-white/80 mb-6 leading-relaxed">
          Masuk untuk mengelola dataset <b>citra banjir</b> serta
          berpartisipasi dalam pengembangan model segmentasi citra banjir
          berbasis <b>Kecerdasan Artificial</b> menggunakan <b>Deep Learning</b>.
        </p>

        {pendingApproval && (
          <div className={`mb-4 p-4 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-start gap-3 ${!lowPerformance ? "animate-fadeIn" : ""}`}>
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">
              Akun Anda telah dibuat namun masih menunggu persetujuan administrator.
              Silakan mencoba login kembali setelah akun disetujui.
            </div>
          </div>
        )}

        {errorType && (
          <div className={`mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/30 flex items-start gap-3 ${!lowPerformance ? "animate-fadeIn" : ""}`}>
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">
              Username atau password tidak valid.
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="space-y-4"
        >

          <div className="relative">
            <User className="absolute left-4 top-3 text-white/60" />

            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              disabled={loading}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-cyan-400/60 outline-none transition disabled:opacity-60"
            />
          </div>

          <div className="relative">
            <LockKeyhole className="absolute left-4 top-3 text-white/60" />

            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={loading}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-cyan-400/60 outline-none transition disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-lg transition-all duration-300 disabled:opacity-40 ${!lowPerformance ? "hover:shadow-xl hover:scale-[1.02]" : ""}`}
          >
            {loading ? "Memverifikasi..." : "Login"}
          </button>

        </form>

        <div className="text-center text-sm text-white/70 mt-6">
          Belum memiliki akun?
          <Link
            to="/register"
            className="ml-1 font-semibold text-cyan-200 hover:text-white transition underline"
          >
            Daftar sebagai Kontributor
          </Link>
        </div>

      </div>
    </div>
  );
}