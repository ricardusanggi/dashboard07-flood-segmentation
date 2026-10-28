// path: frontend/src/pages/auth/Register.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import RegisterView from "./RegisterView";

export default function Register() {

  const navigate = useNavigate();

  const [lowPerformance, setLowPerformance] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: ""
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const [showPendingNotice, setShowPendingNotice] = useState(false);

  // 🔥 WAJIB: terms agreement
  const [agreeTerms, setAgreeTerms] = useState(false);

  // modal
  const [showTerms, setShowTerms] = useState(false);

  /* ================= DEVICE PERFORMANCE ================= */

  useEffect(() => {

    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setLowPerformance(mediaQuery.matches || reducedMotion.matches);
    };

    update();

    mediaQuery.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };

  }, []);

  /* ================= VALIDATION ================= */

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateStrongPassword(password: string) {

    if (!password) return "Password wajib diisi";
    if (password.length < 8) return "Minimal 8 karakter";
    if (!/[A-Z]/.test(password)) return "Harus ada huruf besar";
    if (!/[a-z]/.test(password)) return "Harus ada huruf kecil";
    if (!/[0-9]/.test(password)) return "Harus ada angka";
    if (!/[!@#$%^&*()\,.?":{}|<>]/.test(password)) return "Harus ada karakter spesial (!@#$%^&*...)";

    return "";
  }

  useEffect(() => {

    setErrors({
      email: form.email && !validateEmail(form.email)
        ? "Format email tidak valid"
        : "",

      password: validateStrongPassword(form.password),

      confirm_password:
        form.confirm_password !== form.password
          ? "Konfirmasi password tidak cocok"
          : "",

      full_name:
        !form.full_name.trim()
          ? "Nama lengkap wajib diisi"
          : ""
    });

  }, [form]);

  const formValid =
    !errors.email &&
    !errors.password &&
    !errors.confirm_password &&
    !errors.full_name &&
    form.username &&
    form.email &&
    agreeTerms; // 🔥 wajib setuju

  /* ================= REGISTER ================= */

  async function register() {

    if (!formValid) return;

    try {

      setLoading(true);

      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        password: form.password
      });

      setShowPendingNotice(true);

      setForm({
        username: "",
        email: "",
        full_name: "",
        password: "",
        confirm_password: ""
      });

      setAgreeTerms(false);

    } catch (err: any) {

      alert(err?.response?.data?.detail || "Registrasi gagal");

    } finally {

      setLoading(false);

    }

  }

  return (

    <RegisterView
      form={form}
      setForm={setForm}
      errors={errors}
      loading={loading}
      showPendingNotice={showPendingNotice}
      navigate={navigate}
      register={register}
      lowPerformance={lowPerformance}

      // 🔥 tambahan penting
      showTerms={showTerms}
      setShowTerms={setShowTerms}
      agreeTerms={agreeTerms}
      setAgreeTerms={setAgreeTerms}
    />

  );
}