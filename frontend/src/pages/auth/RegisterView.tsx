// path: frontend/src/pages/auth/RegisterView.tsx

import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Droplets,
  User,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
  FileText
} from "lucide-react";

export default function RegisterView({
  form,
  setForm,
  errors,
  loading,
  showPendingNotice,
  navigate,
  register,
  showTerms,
  setShowTerms,
  agreeTerms,
  setAgreeTerms,
  lowPerformance
}: any) {

  /* ================= SUCCESS ================= */

  if (showPendingNotice) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-700 text-white">

        <div className="max-w-md w-full p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-center">

          <div className="text-6xl mb-4">⏳</div>

          <h2 className="text-2xl font-bold mb-3">
            Menunggu Persetujuan Admin
          </h2>

          <p className="text-sm text-white/80 mb-6 leading-relaxed">
            Akun Anda berhasil dibuat sebagai <b>kontributor dataset banjir</b>.
            <br /><br />
            Admin akan melakukan verifikasi sebelum akun dapat digunakan.
            <br />
            Setelah disetujui, Anda dapat login dan mulai berkontribusi.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 transition"
          >
            Ke Halaman Login
          </button>

        </div>

      </div>
    );
  }

  /* ================= FORM ================= */

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-700 relative overflow-hidden text-white">

      {/* BG GLOW (SAMA DENGAN LOGIN) */}
      {!lowPerformance && (
        <>
          <div className="absolute w-[650px] h-[650px] bg-blue-500/20 blur-[140px] rounded-full top-[-200px] left-[-200px]" />
          <div className="absolute w-[550px] h-[550px] bg-cyan-500/20 blur-[140px] rounded-full bottom-[-200px] right-[-200px]" />
        </>
      )}

      {/* BACK */}
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
      >
        <ArrowLeft size={18} />
        Kembali ke Login
      </Link>

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">

        {/* TITLE */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Droplets className="w-8 h-8 text-cyan-300" />
          <h2 className="text-2xl font-bold text-center">
            Sistem Deteksi Banjir
          </h2>
        </div>

        {/* DESC */}
        <p className="text-center text-sm text-white/80 mb-6 leading-relaxed">
          Daftar sebagai <b>kontributor</b> untuk membantu pengembangan
          model segmentasi <b>citra banjir berbasis AI</b>.
        </p>

        {/* FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            register();
          }}
          className="space-y-4"
        >

          {/* USERNAME */}
          <Input icon={<User />} value={form.username}
            onChange={(v: string) => setForm({ ...form, username: v })}
            placeholder="Username"
          />

          {/* EMAIL */}
          <Input icon={<Mail />} value={form.email}
            onChange={(v: string) => setForm({ ...form, email: v })}
            placeholder="Email"
          />
          {errors.email && <Error text={errors.email} />}

          {/* FULL NAME */}
          <Input icon={<User />} value={form.full_name}
            onChange={(v: string) => setForm({ ...form, full_name: v })}
            placeholder="Nama Lengkap"
          />
          {errors.full_name && <Error text={errors.full_name} />}

          {/* PASSWORD */}
          <Input icon={<Lock />} type="password"
            value={form.password}
            onChange={(v: string) => setForm({ ...form, password: v })}
            placeholder="Password"
          />
          {errors.password && <Error text={errors.password} />}

          {/* CONFIRM */}
          <Input type="password"
            value={form.confirm_password}
            onChange={(v: string) => setForm({ ...form, confirm_password: v })}
            placeholder="Konfirmasi Password"
          />
          {errors.confirm_password && <Error text={errors.confirm_password} />}

          {/* TERMS */}
          <div className="text-xs text-white/70">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />{" "}
            Saya menyetujui{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-cyan-300 underline hover:text-white"
            >
              syarat & ketentuan kontribusi
            </button>
          </div>

          {!agreeTerms && (
            <p className="text-red-300 text-xs">
              Anda harus menyetujui syarat terlebih dahulu
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={!agreeTerms || loading}
            className={`w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-lg transition-all duration-300 disabled:opacity-40 ${!lowPerformance ? "hover:shadow-xl hover:scale-[1.02]" : ""}`}
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>

        </form>

        {/* LOGIN LINK */}
        <div className="text-center text-sm text-white/70 mt-6">
          Sudah punya akun?
          <Link
            to="/login"
            className="ml-1 font-semibold text-cyan-200 hover:text-white transition underline"
          >
            Login
          </Link>
        </div>

      </div>

      {/* ================= TERMS MODAL ================= */}

      {showTerms &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

            <div className="bg-white text-gray-800 p-6 rounded-xl w-[500px] max-h-[80vh] overflow-y-auto shadow-2xl">

              <h3 className="text-lg font-semibold mb-4 flex gap-2">
                <FileText size={18} />
                Syarat Kontributor Dataset Banjir
              </h3>

              <div className="text-sm space-y-3">

                <p><b>✔ Kewajiban:</b></p>
                <ul className="list-disc ml-5">
                  <li>Mengunggah citra banjir yang jelas dan valid</li>
                  <li>Memberikan label area banjir secara akurat</li>
                  <li>Menggunakan data asli (bukan manipulasi)</li>
                  <li>Mengikuti standar dataset sistem</li>
                </ul>

                <p><b>✖ Larangan:</b></p>
                <ul className="list-disc ml-5">
                  <li>Upload data tidak relevan</li>
                  <li>Label tidak sesuai</li>
                  <li>Duplikasi berlebihan</li>
                  <li>Penyalahgunaan sistem</li>
                </ul>

                <p className="text-xs text-gray-500">
                  Admin berhak menolak akun atau dataset yang tidak sesuai standar penelitian.
                </p>

              </div>

              <div className="mt-5 text-right">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Tutup
                </button>
              </div>

            </div>

          </div>,
          document.body
        )}

    </div>
  );
}

/* ================= COMPONENT ================= */

function Input({ icon, onChange, ...props }: any) {
  return (
    <div className="relative">
      {icon && <div className="absolute left-4 top-3 text-white/60">{icon}</div>}
      <input {...props}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-cyan-400/60 outline-none transition"
      />
    </div>
  );
}

function Error({ text }: { text: string }) {
  return (
    <p className="text-xs text-red-300 flex gap-1">
      <AlertCircle size={12} />
      {text}
    </p>
  );
}