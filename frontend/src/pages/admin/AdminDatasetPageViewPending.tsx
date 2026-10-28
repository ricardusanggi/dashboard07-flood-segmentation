// src/pages/admin/AdminDatasetPageViewPending.tsx

import { useState } from "react";
import Card from "../../components/ui/Card";
import Spinner from "../../components/Spinner";
import type { Pending, PreviewItem } from "./types/datasetTypes";
import { Eye } from "lucide-react";

type Props = {
  pending: Pending[];
  loading: boolean;
  processingId: number | null;
  onAction: (action: "approve" | "reject" | "cancel", id: number) => void;
  onPreview: (id: number) => Promise<PreviewItem[]>;
};

/* ================= SEGMENTATION PREVIEW PAIRS ================= */

function SegmentationPreviewPairs({ items }: { items: PreviewItem[] }) {
  const imgGroup  = items.find(g => g.label.toLowerCase().includes("image"));
  const maskGroup = items.find(g => g.label.toLowerCase().includes("mask"));

  if (imgGroup && maskGroup) {
    const pairs = imgGroup.images.slice(0, 6).map((img) => {
      const stem = img.filename.replace(/\.[^.]+$/, "");
      const mask =
        maskGroup.images.find((m) => m.filename.replace(/\.[^.]+$/, "") === stem) ??
        null;
      return { image: img, mask };
    });

    return (
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Menampilkan sampel pasangan citra asli dan mask segmentasi banjir.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pairs.map((pair, i) => (
            <div
              key={i}
              className="border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900"
            >
              <div className="grid grid-cols-2 divide-x dark:divide-gray-700">
                <div>
                  <div className="text-[10px] text-center text-gray-400 py-1 bg-gray-50 dark:bg-gray-800 font-medium">
                    Citra Asli
                  </div>
                  <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={`data:image/jpeg;base64,${pair.image.image_base64}`}
                      alt={pair.image.filename}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-center text-gray-400 py-1 bg-gray-50 dark:bg-gray-800 font-medium">
                    Mask
                  </div>
                  <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {pair.mask ? (
                      <img
                        src={`data:image/jpeg;base64,${pair.mask.image_base64}`}
                        alt={pair.mask.filename}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Tidak tersedia
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 text-[10px] text-gray-400 truncate">
                {pair.image.filename}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: tampilkan per-folder
  return (
    <div className="space-y-8">
      {items.map((group, i) => (
        <div
          key={i}
          className="border dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/40"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-md font-semibold text-cyan-600 dark:text-cyan-400">
              {group.label}
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
              {group.images?.length ?? 0} Citra
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.images.slice(0, 6).map((img, j) => (
              <div
                key={j}
                className="group bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${img.image_base64}`}
                    alt={img.filename}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {img.filename}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminDatasetPageViewPending({
  pending,
  loading,
  processingId,
  onAction,
  onPreview
}: Props) {
  const [previewFor,     setPreviewFor]     = useState<number | null>(null);
  const [previewItems,   setPreviewItems]   = useState<PreviewItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (loading) return <Spinner />;

  async function handlePreview(id: number) {
    if (previewFor === id) {
      setPreviewFor(null);
      setPreviewItems([]);
      return;
    }
    try {
      setPreviewLoading(true);
      setPreviewFor(id);
      const data = await onPreview(id);
      setPreviewItems(data || []);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <Card className="p-6 dark:bg-gray-900 dark:border-gray-700">

      {/* ================= HEADER ================= */}

      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Pending Dataset Review
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tinjau dataset citra <b>banjir</b> sebelum menyetujui atau menolak.
        </p>
        <p className="text-xs text-gray-500 mt-2 max-w-xl">
          Setiap dataset yang diunggah terdiri dari{" "}
          <b>pasangan citra asli dan mask segmentasi</b>.
          Administrator memverifikasi kesesuaian pasangan citra-mask sebelum
          dataset dimasukkan ke dalam data pelatihan model segmentasi banjir
          berbasis <b>Deep Learning</b>.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Tidak ada dataset yang sedang menunggu review.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-xl dark:border-gray-700">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="py-3 px-4">Dataset ID</th>
                  <th className="py-3 px-4">Kontributor</th>
                  <th className="py-3 px-4">Pasangan Citra-Mask</th>
                  <th className="py-3 px-4">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {pending.map((p, index) => (
                  <tr
                    key={p.log_id}
                    className={`
                      border-t dark:border-gray-700
                      ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                      hover:bg-cyan-50 dark:hover:bg-cyan-900/20
                      transition
                    `}
                  >
                    <td className="py-3 px-4 font-medium">#{p.log_id}</td>

                    <td className="py-3 px-4">{p.uploader_name}</td>

                    <td className="py-3 px-4 font-semibold text-cyan-600 dark:text-cyan-300">
                      {p.total_images}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2 flex-wrap">

                        <button
                          type="button"
                          onClick={() => handlePreview(p.log_id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          <Eye size={14} className="inline mr-1" />
                          Preview
                        </button>

                        <button
                          type="button"
                          disabled={processingId === p.log_id}
                          onClick={() => onAction("approve", p.log_id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {processingId === p.log_id ? "Processing..." : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={processingId === p.log_id}
                          onClick={() => onAction("reject", p.log_id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          disabled={processingId === p.log_id}
                          onClick={() => onAction("cancel", p.log_id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Cancel
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= PREVIEW PANEL ================= */}

          {previewFor !== null && (
            <div className="mt-8 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-lg p-6">

              <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold dark:text-gray-200">
                    📂 Preview Dataset Segmentasi #{previewFor}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {previewItems.find(g => g.label.toLowerCase().includes("image"))
                      ? `${previewItems.find(g => g.label.toLowerCase().includes("image"))!.total_images} pasangan citra-mask`
                      : `${previewItems.length} folder`
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setPreviewFor(null); setPreviewItems([]); }}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Tutup
                </button>
              </div>

              {previewLoading && <Spinner />}

              {!previewLoading && previewItems.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tidak ada preview tersedia.
                </p>
              )}

              {!previewLoading && previewItems.length > 0 && (
                <SegmentationPreviewPairs items={previewItems} />
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
