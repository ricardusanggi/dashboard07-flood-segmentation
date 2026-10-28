// path: frontend/src/pages/user/DashboardUserViewProfile.tsx

import { useState } from "react";
import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";

type User = {
  full_name: string;
  email: string;
  role?: string;
};

type FormData = {
  full_name: string;
  email: string;
};

type PasswordForm = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

type Props = {
  user: User;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  form: FormData;
  setForm: (v: FormData) => void;
  onSaveProfile: (payload: any) => Promise<any> | void;
};

export default function DashboardUserViewProfile({
  user,
  editMode,
  setEditMode,
  form,
  setForm,
  onSaveProfile
}: Props) {

  const normalizedRole = user?.role?.toLowerCase();

  const isVerified =
    normalizedRole === "registered" ||
    normalizedRole === "admin";

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {

    setError(null);

    if (!form.full_name.trim())
      return setError("Nama peneliti tidak boleh kosong.");

    if (!form.email.includes("@"))
      return setError("Format email tidak valid.");

    if (
      passwordForm.old_password ||
      passwordForm.new_password ||
      passwordForm.confirm_password
    ) {

      if (!passwordForm.old_password)
        return setError("Password lama wajib diisi.");

      if (passwordForm.new_password.length < 6)
        return setError("Password baru minimal 6 karakter.");

      if (passwordForm.new_password !== passwordForm.confirm_password)
        return setError("Konfirmasi password tidak cocok.");

    }

    try {

      setSaving(true);

      await onSaveProfile({
        full_name: form.full_name,
        email: form.email,
        old_password: passwordForm.old_password || undefined,
        new_password: passwordForm.new_password || undefined
      });

      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: ""
      });

      setEditMode(false);

      window.location.reload();

    } catch (err: any) {

      setError(
        err?.response?.data?.message ??
        "Gagal memperbarui data peneliti."
      );

    } finally {

      setSaving(false);

    }

  }

  return (

    <Section title="🌊 Profil Peneliti">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

          <div className="flex flex-col items-center text-center">

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">

              {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}

            </div>

            <h3 className="mt-4 text-lg font-semibold">
              {user?.full_name}
            </h3>

            <p className="text-sm text-gray-500">
              {user?.email}
            </p>

            <span
              className={`mt-3 px-4 py-1 rounded-full text-xs font-semibold ${
                isVerified
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {isVerified
                ? "Peneliti Terverifikasi"
                : "Belum Terverifikasi"}
            </span>

            <span className="mt-2 text-xs text-gray-400">
              Peran Sistem: {user?.role}
            </span>

          </div>

        </Card>

        <Card className="lg:col-span-2 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

          {!editMode ? (

            <div className="space-y-6">

              <div>

                <label className="text-sm text-gray-500">
                  Nama Peneliti
                </label>

                <div className="mt-1 font-medium text-lg">
                  {user?.full_name}
                </div>

              </div>

              <div>

                <label className="text-sm text-gray-500">
                  Email Peneliti
                </label>

                <div className="mt-1 font-medium text-lg">
                  {user?.email}
                </div>

              </div>

              <button
                onClick={() => setEditMode(true)}
                className="mt-4 px-6 py-2 rounded-xl bg-yellow-500 text-white hover:bg-orange-500 transition"
              >
                Edit Data Peneliti
              </button>

            </div>

          ) : (

            <div className="space-y-6">

              <div>

                <label className="text-sm text-gray-500">
                  Nama Peneliti
                </label>

                <input
                  className="mt-1 w-full border rounded-xl p-3 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value
                    })
                  }
                />

              </div>

              <div>

                <label className="text-sm text-gray-500">
                  Email Peneliti
                </label>

                <input
                  className="mt-1 w-full border rounded-xl p-3 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                />

              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">

                <h4 className="font-semibold mb-4">
                  🔒 Ubah Password
                </h4>

                <div className="space-y-4">

                  <input
                    type="password"
                    placeholder="Password Lama"
                    className="w-full border rounded-xl p-3 border-gray-300 dark:border-gray-700"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        old_password: e.target.value
                      })
                    }
                  />

                  <input
                    type="password"
                    placeholder="Password Baru"
                    className="w-full border rounded-xl p-3 border-gray-300 dark:border-gray-700"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password: e.target.value
                      })
                    }
                  />

                  <input
                    type="password"
                    placeholder="Konfirmasi Password Baru"
                    className="w-full border rounded-xl p-3 border-gray-300 dark:border-gray-700"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm_password: e.target.value
                      })
                    }
                  />

                </div>

              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">

                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-yellow-500 text-white hover:bg-orange-500 transition disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>

                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-200 dark:bg-gray-700"
                >
                  Batal
                </button>

              </div>

            </div>

          )}

        </Card>

      </div>

    </Section>

  );

}