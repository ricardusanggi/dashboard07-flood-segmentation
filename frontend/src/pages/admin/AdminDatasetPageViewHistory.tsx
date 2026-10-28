// src/pages/admin/AdminDatasetPageViewHistory.tsx

import Card from "../../components/ui/Card";
import Spinner from "../../components/Spinner";
import type {
  UserEntry,
  TrainStats,
  PreviewItem,
  DatasetStatus
} from "./types/datasetTypes";

type Props = {
  history: UserEntry[];
  loading: boolean;
  trainStats: TrainStats;
  previewItems: PreviewItem[];
  previewLoading: boolean;
  showTrainPreview: boolean;
  onToggleTrainPreview: () => void;
  setSelectedClasses: (v: string[]) => void;
  setShowClassModal: (v: boolean) => void;
  setShowTrainModal: (v: boolean) => void;
};

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }: { status: DatasetStatus }) {
  const style: Record<DatasetStatus, string> = {
    pending:
      "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300",
    approved:
      "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300",
    rejected:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300",
    cancelled:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold ${style[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ================= STAT CARD ================= */

function Stat({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red" | "yellow" | "purple";
}) {
  const styles = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/40",
      text: "text-blue-700 dark:text-blue-300"
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/40",
      text: "text-green-700 dark:text-green-300"
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/40",
      text: "text-red-700 dark:text-red-300"
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-900/40",
      text: "text-yellow-700 dark:text-yellow-300"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/40",
      text: "text-purple-700 dark:text-purple-300"
    }
  };

  return (
    <div
      className={`
      p-5 rounded-xl shadow-sm hover:shadow-md transition
      flex flex-col items-center justify-center text-center
      ${styles[color].bg}
    `}
    >
      <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
        {label}
      </div>
      <div className={`text-3xl font-bold tabular-nums mt-1 ${styles[color].text}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

/* ================= SEGMENTATION DISTRIBUTION CHART ================= */

function SegmentationDistributionChart({
  data
}: {
  data: Record<string, number> | undefined;
}) {
  if (!data || Object.keys(data).length === 0) return null;

  const entries = Object.entries(data);
  const max = Math.max(...entries.map((e) => e[1]));

  return (
    <div className="mt-6">
      <div className="text-sm font-semibold mb-3">📊 Jumlah File per Folder</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Jumlah file di masing-masing folder dataset pelatihan (images/ dan masks/).
      </p>
      <div className="space-y-2">
        {entries.map(([label, count]) => {
          const width = max > 0 ? (count / max) * 100 : 0;
          return (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{label}/</span>
                <span className="text-gray-500">{count.toLocaleString()} file</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-2 bg-cyan-500 rounded"
                  style={{ width: `${width.toFixed(1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {entries.length === 2 && entries[0][1] === entries[1][1] && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          ✓ Jumlah file images dan masks seimbang ({entries[0][1].toLocaleString()} pasang)
        </p>
      )}
      {entries.length === 2 && entries[0][1] !== entries[1][1] && (
        <p className="text-xs text-red-500 mt-2">
          ⚠ Jumlah file tidak seimbang — selisih {Math.abs(entries[0][1] - entries[1][1]).toLocaleString()} file
        </p>
      )}
    </div>
  );
}

/* ================= SEGMENTATION PREVIEW PAIRS ================= */

function SegmentationPreviewPairs({ items }: { items: PreviewItem[] }) {
  const imgGroup  = items.find(g => g.label.toLowerCase().includes("image"));
  const maskGroup = items.find(g => g.label.toLowerCase().includes("mask"));

  // Paired segmentation view
  if (imgGroup && maskGroup) {
    const pairs = imgGroup.images.map((img) => {
      const stem = img.filename.replace(/\.[^.]+$/, "");
      const mask =
        maskGroup.images.find((m) => m.filename.replace(/\.[^.]+$/, "") === stem) ??
        null;
      return { image: img, mask };
    });

    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Pasangan Citra & Mask
          </span>
          <span className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-3 py-1 rounded-full">
            {pairs.length} pasang
          </span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {pairs.map((pair, i) => (
            <div
              key={i}
              className="border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-gray-900"
            >
              <div className="grid grid-cols-2 divide-x dark:divide-gray-700">
                <div>
                  <div className="text-[10px] text-center text-gray-400 py-1 bg-gray-50 dark:bg-gray-800">
                    Citra Asli
                  </div>
                  <img
                    src={`data:image/jpeg;base64,${pair.image.image_base64}`}
                    alt={pair.image.filename}
                    className="w-full aspect-square object-cover"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-center text-gray-400 py-1 bg-gray-50 dark:bg-gray-800">
                    Mask
                  </div>
                  {pair.mask ? (
                    <img
                      src={`data:image/jpeg;base64,${pair.mask.image_base64}`}
                      alt={pair.mask.filename}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-gray-400 text-xs">
                      —
                    </div>
                  )}
                </div>
              </div>
              <div className="px-2 py-1 text-[10px] text-gray-400 truncate">
                {pair.image.filename}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: single-folder display
  return (
    <div className="space-y-6">
      {items.map((group) => (
        <div key={group.label}>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
              {group.label}
            </div>
            <div className="text-xs bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              {group.total_images} Citra
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
            {group.images.map((img) => (
              <div
                key={img.filename}
                className="border rounded-xl overflow-hidden dark:border-gray-700 shadow-sm hover:shadow-lg transition"
              >
                <img
                  src={`data:image/jpeg;base64,${img.image_base64}`}
                  alt={img.filename}
                  className="w-full aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminDatasetPageViewHistory({
  history,
  loading,
  trainStats,
  previewItems,
  previewLoading,
  showTrainPreview,
  onToggleTrainPreview,
  setSelectedClasses,
  setShowClassModal,
  setShowTrainModal
}: Props) {
  const totalUploads  = history.length;
  const approvedCount = history.filter((h) => h.status === "approved").length;
  const rejectedCount = history.filter((h) => h.status === "rejected").length;
  const pendingCount  = history.filter((h) => h.status === "pending").length;
  const readyToMerge  = history.filter((h) => h.status === "merged").length;

  function getPerClassCI(key: string): number {
    if (!trainStats?.per_class) return 0;
    const found = Object.entries(trainStats.per_class).find(
      ([k]) => k.toLowerCase() === key.toLowerCase()
    );
    return found ? found[1] : 0;
  }
  const imagesCount  = getPerClassCI("images");
  const masksCount   = getPerClassCI("masks");
  const imagesEqMasks = imagesCount === masksCount && imagesCount > 0;

  if (loading) {
    return (
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-700">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card className="p-6 dark:bg-gray-900 dark:border-gray-700">

      {/* ================= DESKRIPSI ================= */}

      <div className="mb-6 text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
        Halaman ini menampilkan riwayat dataset citra <b>banjir</b> yang digunakan
        dalam proses pelatihan model segmentasi berbasis <b>Deep Learning</b>.
        Setiap dataset terdiri dari <b>pasangan citra asli dan mask segmentasi</b>{" "}
        yang diunggah oleh kontributor dan divalidasi oleh administrator sebelum
        dimasukkan ke dalam dataset pelatihan utama.
      </div>

      {/* ================= SUMMARY STATS ================= */}

      <div className="grid grid-cols-2 md:grid-cols-7 gap-5 mb-6">
        <Stat label="Total Upload"      value={totalUploads}  color="blue"   />
        <Stat label="Approved"          value={approvedCount} color="green"  />
        <Stat label="Rejected"          value={rejectedCount} color="red"    />
        <Stat label="Pending"           value={pendingCount}  color="yellow" />
        <Stat label="Dataset Digabung"  value={readyToMerge}  color="purple" />

        {/* TRAIN DATASET CARD */}
        <div
          className={`
            col-span-2 p-5 rounded-xl border shadow-sm hover:shadow-md transition
            ${
              imagesEqMasks && trainStats?.is_synced
                ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/30 border-green-200"
                : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/30 border-red-300"
            }
          `}
        >
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">
            📂 Dataset Pelatihan Segmentasi
          </div>

          {/* BREAKDOWN FOLDER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Folder <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">images/</code></span>
              <span className={`font-bold tabular-nums ${imagesEqMasks ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {imagesCount.toLocaleString()} file
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Folder <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">masks/</code></span>
              <span className={`font-bold tabular-nums ${imagesEqMasks ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {masksCount.toLocaleString()} file
              </span>
            </div>
            <div className="border-t dark:border-gray-600 pt-2 flex justify-between items-center text-xs">
              <span className="text-gray-500">Database (tercatat)</span>
              <span className={`font-bold tabular-nums ${trainStats?.is_synced ? "text-gray-700 dark:text-gray-300" : "text-red-500"}`}>
                {(trainStats?.database_total ?? 0).toLocaleString()} pasang
              </span>
            </div>
          </div>

          {/* STATUS */}
          <div className={`mt-3 text-xs font-semibold ${imagesEqMasks ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
            {imagesEqMasks
              ? `✓ Images dan masks seimbang (${imagesCount.toLocaleString()} pasang)`
              : `⚠ Tidak seimbang — images: ${imagesCount.toLocaleString()}, masks: ${masksCount.toLocaleString()}`
            }
          </div>

          {/* PREVIEW TOGGLE */}
          <button
            type="button"
            onClick={onToggleTrainPreview}
            className="mt-3 w-full text-xs text-cyan-600 dark:text-cyan-400 hover:underline text-center"
          >
            {showTrainPreview ? "Sembunyikan Preview" : "Lihat Preview Dataset →"}
          </button>
        </div>
      </div>

      {/* ================= DATASET HEALTH WARNINGS ================= */}

      {(trainStats?.is_synced === false ||
        trainStats?.dataset_health?.imbalance_warning ||
        trainStats?.dataset_health?.missing_classes?.length > 0 ||
        trainStats?.dataset_health?.drift_warning ||
        trainStats?.dataset_health?.underrepresented_classes?.length > 0 ||
        trainStats?.duplicate_count > 0) && (
        <div className="mb-6 p-4 rounded-xl border shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/20 dark:border-amber-800 space-y-1 text-sm">
          <div className="font-semibold text-amber-700 dark:text-amber-300">
            Peringatan Kualitas Dataset Segmentasi
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sistem mendeteksi potensi masalah pada dataset pelatihan segmentasi.
          </div>

          {trainStats?.is_synced === false && (
            <div className="text-red-600 dark:text-red-400">
              ⚠ Folder images/ ({trainStats.folder_total.toLocaleString()}) ≠ database ({trainStats.database_total.toLocaleString()} tercatat)
            </div>
          )}

          {trainStats?.dataset_health?.imbalance_warning && (
            <div className="text-orange-600 dark:text-orange-400">
              ⚠ Jumlah file tidak seimbang — images/: {imagesCount.toLocaleString()} file, masks/: {masksCount.toLocaleString()} file
              {" "}(selisih {Math.abs(imagesCount - masksCount).toLocaleString()} file, ada pasangan tidak lengkap)
            </div>
          )}

          {trainStats?.dataset_health?.missing_classes?.length > 0 && (
            <div className="text-red-600 dark:text-red-400">
              ⚠ Kelas segmentasi tidak ditemukan: {trainStats.dataset_health.missing_classes.join(", ")}
            </div>
          )}

          {trainStats?.dataset_health?.drift_warning && (
            <div className="text-yellow-600 dark:text-yellow-400">
              🚨 Distribusi piksel antar batch tidak konsisten (data drift)
            </div>
          )}

          {trainStats?.dataset_health?.underrepresented_classes?.length > 0 && (
            <div className="text-yellow-700 dark:text-yellow-400">
              📉 Kelas dengan area segmentasi sangat kecil:{" "}
              {trainStats.dataset_health.underrepresented_classes.join(", ")}
            </div>
          )}

          {trainStats?.duplicate_count > 0 && (
            <div className="text-red-600 dark:text-red-400">
              🔍 Duplikat citra terdeteksi: {trainStats.duplicate_count} file
            </div>
          )}
        </div>
      )}

      {/* ================= TRAIN DATASET PREVIEW ================= */}

      {showTrainPreview && (
        <div className="mb-8 border rounded-2xl p-6 shadow-sm dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-cyan-600 dark:text-cyan-400">
                📂 Preview Dataset Pelatihan Segmentasi
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Menampilkan sampel pasangan citra asli dan mask segmentasi dari dataset pelatihan.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTrainPreview}
              className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              Tutup
            </button>
          </div>

          {previewLoading && <Spinner />}

          {!previewLoading && previewItems.length === 0 && (
            <p className="text-sm text-gray-500">Tidak ada data preview.</p>
          )}

          {!previewLoading && previewItems.length > 0 && (
            <SegmentationPreviewPairs items={previewItems} />
          )}

          <SegmentationDistributionChart data={trainStats?.per_class} />
        </div>
      )}

      {/* ================= DATASET HISTORY TABLE ================= */}

      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm text-left dark:text-gray-200">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 sticky top-0 z-10">
            <tr>
              <th className="p-3 font-semibold">Dataset ID</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Kontributor</th>
              <th className="p-3 font-semibold">Validator</th>
              <th className="p-3 font-semibold text-right">Pasangan Citra-Mask</th>
              <th className="p-3 font-semibold text-right">Upload #</th>
              <th className="p-3 font-semibold">Waktu</th>
            </tr>
          </thead>

          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Tidak ada data riwayat dataset.
                </td>
              </tr>
            )}

            {history.map((h, index) => (
              <tr
                key={h.id}
                className={`border-t dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-800"
                } hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition`}
              >
                <td className="p-3 font-medium">{h.id}</td>

                <td className="p-3">
                  <StatusBadge status={h.status} />
                </td>

                <td className="p-3">{h.uploader_name}</td>

                <td className="p-3">{h.reviewer_name ?? "-"}</td>

                <td className="p-3 text-right font-semibold tabular-nums">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClasses(h.class_names || []);
                      setShowClassModal(true);
                    }}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    {h.total_images.toLocaleString()}
                  </button>
                </td>

                <td className="p-3 text-right tabular-nums">{h.upload_number}</td>

                <td className="p-3 text-xs text-gray-500">
                  {new Date(h.upload_time).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </Card>
  );
}
