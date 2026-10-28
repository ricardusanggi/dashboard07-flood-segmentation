// src/pages/admin/AdminDatasetPageViewMerge.tsx

import Card from "../../components/ui/Card";
import Spinner from "../../components/Spinner";
import type { MergeSummaryItem } from "./types/datasetTypes";

type Props = {
  summary: MergeSummaryItem[];
  totalImages: number;
  totalLabels: number;
  loading: boolean;

  loadMergeSummary: () => void;
  loadHistory: () => void;
  loadTrainStats: () => void;

  mergeDataset: () => Promise<void>;
};

export default function AdminDatasetPageViewMerge({
  summary,
  totalImages,
  totalLabels,
  loading,
  mergeDataset
}: Props) {

  if (loading) {
    return (
      <Card className="p-6 mt-4 dark:bg-gray-900 dark:border-gray-700">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card className="p-6 mt-4 dark:bg-gray-900 dark:border-gray-700">

      {/* ================= HEADER ================= */}

      <div className="flex justify-between items-start mb-6">

        <div>
          <h3 className="text-lg font-semibold dark:text-gray-200">
            🔄 Merge Dataset Test → Train
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Dataset citra <b>banjir</b> dari folder <b>datasets_test_true</b> akan
            digabungkan ke <b>datasets_train</b>. Proses ini menambahkan data baru
            tanpa menghapus dataset pelatihan yang sudah ada.
          </p>

          {/* TAMBAHAN PENELITIAN */}

          <p className="text-xs text-gray-500 mt-2 max-w-xl">
            Proses merge digunakan untuk memasukkan dataset yang telah diverifikasi
            ke dalam dataset pelatihan utama model segmentasi banjir.
            Dataset yang digabungkan akan digunakan pada proses pelatihan
            <b> Deep Learning</b> untuk meningkatkan performa model.
          </p>
        </div>

        {/* ================= BUTTON MERGE ================= */}

        {summary.length > 0 && (
          <button
            onClick={mergeDataset}
            className="
              px-4
              py-2
              text-sm
              rounded-lg
              bg-green-600
              hover:bg-green-700
              text-white
              font-semibold
              shadow
              transition
            "
          >
            🔄 Merge Dataset
          </button>
        )}

      </div>

      {/* ================= EMPTY STATE ================= */}

      {summary.length === 0 && (
        <div className="p-4 mb-4 bg-green-50 dark:bg-green-900/40 border border-green-300 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
          ✅ Tidak ada dataset pada folder <b>datasets_test_true</b> yang perlu
          digabungkan.
        </div>
      )}

      {/* ================= STATS ================= */}

      {summary.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            <StatCard
              label="Total Citra Banjir"
              value={totalImages}
              color="green"
            />

            <StatCard
              label="Total Kelas Banjir"
              value={totalLabels}
              color="orange"
            />

          </div>

          {/* TAMBAHAN PENELITIAN */}

          <div className="text-xs text-gray-500 mb-4">
            Statistik berikut menunjukkan distribusi citra banjir yang akan
            digabungkan ke dalam dataset pelatihan utama.
          </div>

          {/* ================= TABLE ================= */}

          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">

            <table className="w-full text-sm text-left dark:text-gray-200">

              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">

                <tr>
                  <th className="p-3 font-semibold">
                    Label Banjir
                  </th>

                  <th className="p-3 font-semibold text-right">
                    Jumlah Citra
                  </th>
                </tr>

              </thead>

              <tbody>

                {summary.map((item, i) => (
                  <tr
                    key={i}
                    className="
                      border-t
                      dark:border-gray-700
                      hover:bg-gray-50
                      dark:hover:bg-gray-800
                      transition
                    "
                  >

                    <td className="p-3">
                      {item.label}
                    </td>

                    <td className="p-3 text-right font-semibold tabular-nums">
                      {item.count}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        </>
      )}

    </Card>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: "green" | "orange";
}) {

  const styles = {
    green:
      "bg-green-50 dark:bg-green-900/40 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300",

    orange:
      "bg-orange-50 dark:bg-orange-900/40 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300"
  };

  return (
    <div
      className={`
        p-4
        rounded-lg
        border
        text-center
        ${styles[color]}
      `}
    >

      <div className="text-xs text-gray-600 dark:text-gray-300">
        {label}
      </div>

      <div className="text-2xl font-bold mt-1">
        {value.toLocaleString()}
      </div>

    </div>
  );
}