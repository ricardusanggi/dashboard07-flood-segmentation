// frontend/src/pages/user/DashboardUserViewOverview.tsx

import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";

import {
  Image,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Users
} from "lucide-react";

type User = {
  full_name?: string;
};

type Overview = {
  database_summary?: {
    total_images?: number;
    total_labels?: number;
  };
  train_folder_summary?: {
    total_images?: number;
  };
  is_consistent?: boolean;
};

type Props = {
  user?: User | null;
  overview?: Overview;
};

export default function DashboardUserViewOverview({ user, overview }: Props) {

  const dbImages = overview?.database_summary?.total_images ?? 0;
  const dbLabels = overview?.database_summary?.total_labels ?? 0;
  const trainImages = overview?.train_folder_summary?.total_images ?? 0;

  const isConsistent = overview?.is_consistent ?? true;

  const difference = Math.abs(dbImages - trainImages);

  const userName = user?.full_name || "Peneliti";

  function formatNumber(num: number) {
    return num.toLocaleString("id-ID");
  }

  return (

    <Section title="🌊 Dashboard Sistem Deteksi Banjir">

      {/* ================= HERO CARD ================= */}

      <Card className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm opacity-80">
              Selamat datang kembali
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {userName}
            </h2>

            <p className="text-sm opacity-80 mt-2 max-w-md">
              Anda berkontribusi dalam pengembangan dataset citra banjir
              untuk meningkatkan kualitas model segmentasi citra banjir
              berbasis kecerdasan artificial.
            </p>

          </div>

        </div>

      </Card>

      {/* ================= KPI ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

        {/* TOTAL DATASET */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <Image size={24} className="text-blue-600 dark:text-blue-300" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Total Citra Dataset Banjir
              </p>

              <p className="text-2xl font-semibold">
                {formatNumber(dbImages)}
              </p>

            </div>

          </div>

        </Card>

        {/* TOTAL LABEL */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/40">
              <Layers size={24} className="text-cyan-600 dark:text-cyan-300" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Total Kategori Area Banjir
              </p>

              <p className="text-2xl font-semibold">
                {formatNumber(dbLabels)}
              </p>

            </div>

          </div>

        </Card>

      </div>

      {/* ================= CONSISTENCY CHECK ================= */}

      <div className="mt-8">

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

          <div className="flex items-start gap-4">

            {isConsistent ? (
              <ShieldCheck className="text-blue-600 w-6 h-6 mt-1" />
            ) : (
              <AlertTriangle className="text-red-600 w-6 h-6 mt-1" />
            )}

            <div className="w-full">

              <h4
                className={`font-semibold ${
                  isConsistent
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {isConsistent
                  ? "Dataset Konsisten"
                  : "Dataset Tidak Konsisten"}
              </h4>

              <p className="text-sm text-gray-500 mt-1">

                {isConsistent
                  ? "Jumlah citra dataset banjir konsisten antara database dan folder pelatihan."
                  : "Terdapat perbedaan jumlah citra antara database dan folder pelatihan."}

              </p>

              <div className="mt-4 space-y-2 text-sm text-gray-600">

                <div className="flex justify-between">
                  <span>Total Citra (Database)</span>
                  <span className="font-semibold">
                    {formatNumber(dbImages)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Total Citra (Folder Pelatihan)</span>
                  <span className="font-semibold">
                    {formatNumber(trainImages)}
                  </span>
                </div>

                {!isConsistent && (

                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Selisih</span>
                    <span>
                      {formatNumber(difference)}
                    </span>
                  </div>

                )}

              </div>

            </div>

          </div>

        </Card>

      </div>

      {/* ================= CONTRIBUTION SECTION ================= */}

      <div className="mt-12">

        <Card className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

          <div className="flex items-start gap-4">

            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
              <Users className="w-6 h-6" />
            </div>

            <div>

              <h3 className="text-lg font-semibold">
                Kontribusi Dataset Penelitian
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">

                Dataset citra banjir yang Anda unggah berperan penting
                dalam meningkatkan kualitas model segmentasi citra
                banjir berbasis kecerdasan artificial.

                Sistem memastikan bahwa dataset yang Anda kontribusikan
                telah terintegrasi secara konsisten dalam proses
                pelatihan model.

              </p>

              <div className="mt-5 text-sm font-medium text-blue-600 dark:text-blue-400">

                Kontribusi Anda membantu meningkatkan akurasi sistem deteksi banjir.

              </div>

            </div>

          </div>

        </Card>

      </div>

    </Section>

  );

}