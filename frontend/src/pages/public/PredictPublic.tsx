// frontend/src/pages/public/PredictPublic.tsx

import { useState, useRef, useEffect } from "react";
import PublicLayout from "../../components/layouts/PublicLayout";
import { Droplets, UploadCloud, Brain } from "lucide-react";
import { segmentImage, getSegmentationMethodInfo } from "../../api/predictApi";

type SegmentResult = {
  method: string;
  segmented_image: string;
  overlay_image: string;
  original_image: string;
  flood_percentage?: number | null;
};

const METHOD_LABEL: Record<string, string> = {
  otsu:      "Otsu Thresholding",
  adaptive:  "Adaptive Thresholding",
  watershed: "Watershed",
  kmeans:    "K-Means Clustering",
  unet:      "U-Net Deep Learning",
  deeplab:   "DeepLabV3+",
};

function floodColor(pct: number) {
  if (pct < 10) return { text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700" };
  if (pct < 40) return { text: "text-amber-500",   bg: "bg-amber-50 border-amber-200",     badge: "bg-amber-100 text-amber-700"   };
  return          { text: "text-red-600",     bg: "bg-red-50 border-red-200",         badge: "bg-red-100 text-red-700"       };
}

function floodLevel(pct: number) {
  if (pct < 10) return "Tidak / Rendah Terdampak";
  if (pct < 40) return "Terdampak Sedang";
  return          "Terdampak Tinggi";
}

export default function PredictPublic() {

  const imageRef = useRef<HTMLInputElement | null>(null);

  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [result,  setResult]  = useState<SegmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const [methodInfo,    setMethodInfo]    = useState<any>(null);
  const [checkingModel, setCheckingModel] = useState(true);
  const [activeTab,     setActiveTab]     = useState<"overlay" | "mask" | "original">("overlay");

  /* ===== load info metode ===== */
  useEffect(() => {
    (async () => {
      try {
        const info = await getSegmentationMethodInfo();
        setMethodInfo(info);
      } catch {
        setMethodInfo(null);
      } finally {
        setCheckingModel(false);
      }
    })();
  }, []);

  const unetNotReady = methodInfo?.method === "unet" && !methodInfo?.model_active;
  const systemReady  = !checkingModel && methodInfo && !unetNotReady;
  const methodLabel  = methodInfo ? (METHOD_LABEL[methodInfo.method] ?? methodInfo.method) : "—";

  /* ===== file helpers ===== */
  function handleImage(f: File | null) {
    if (!f || !f.type.startsWith("image/")) return;
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    setResult(null);
  }

  function reset() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setResult(null);
    setLatency(null);
    if (imageRef.current) imageRef.current.value = "";
  }

  /* ===== segmentasi ===== */
  async function runSegment() {
    if (!imageFile) { alert("Pilih citra asli terlebih dahulu."); return; }
    setLoading(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const res = await segmentImage(imageFile);
      setLatency(Math.round(performance.now() - t0));
      setResult(res);
      setActiveTab("overlay");
    } catch (err: any) {
      if (err?.response?.status === 409) { alert("Model belum tersedia."); return; }
      alert("Gagal memproses gambar: " + (err?.response?.data?.detail ?? err?.message ?? ""));
    } finally {
      setLoading(false);
    }
  }

  const pct    = result?.flood_percentage ?? null;
  const colors = pct != null ? floodColor(pct) : null;

  return (
    <PublicLayout>

      {/* HERO */}
      <section className="text-center py-8 bg-gradient-to-br from-slate-900 via-blue-800 to-cyan-800 text-white">
        <div className="flex justify-center items-center gap-3">
          <Droplets className="w-7 h-7 text-cyan-300" />
          <h1 className="text-2xl md:text-3xl font-bold">Sistem Segmentasi Citra Banjir</h1>
        </div>
        <p className="text-sm mt-2 text-white/80">
          Metode aktif —{" "}
          <span className="text-cyan-300 font-semibold">{methodLabel}</span>
        </p>
      </section>

      {/* MAIN */}
      <section className="py-10 px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">

          {checkingModel && (
            <p className="text-center py-10 text-gray-400 text-sm">
              Memeriksa status sistem...
            </p>
          )}

          {!checkingModel && unetNotReady && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow border">
              <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-6 text-indigo-800 flex gap-3">
                <Brain size={20} className="mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-base">Model U-Net Belum Tersedia</p>
                  <p className="text-sm mt-2 leading-relaxed">
                    Metode aktif adalah <b>U-Net</b> namun belum ada model yang diaktifkan admin.
                    <br />Silakan hubungi admin atau gunakan metode klasik di <code>.env</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {systemReady && (
            <div className="grid md:grid-cols-2 gap-6">

              {/* KOLOM KIRI: INPUT */}
              <div className="space-y-4">

                {/* CITRA ASLI */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow border">
                  <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <UploadCloud size={16} className="text-indigo-500" />
                    Citra yang Ingin Dideteksi
                  </p>

                  {!imagePreview ? (
                    <div
                      onClick={() => imageRef.current?.click()}
                      onDrop={(e) => { e.preventDefault(); handleImage(e.dataTransfer.files?.[0] ?? null); }}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition"
                    >
                      <UploadCloud className="mx-auto mb-2 w-10 h-10 text-gray-300" />
                      <p className="text-sm text-gray-500">Klik atau seret citra ke sini</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, TIFF — maks 20 MB</p>
                      <input
                        ref={imageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        title="Pilih citra asli"
                        aria-label="Unggah citra asli"
                        onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => imageRef.current?.click()}
                          className="text-indigo-600 hover:underline"
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          className="text-red-500 hover:underline"
                        >
                          Hapus
                        </button>
                        <input
                          ref={imageRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          title="Pilih citra asli"
                          aria-label="Ganti citra asli"
                          onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                        />
                      </div>
                      <img
                        src={imagePreview}
                        alt="Preview citra asli"
                        className="w-full max-h-56 object-contain rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* TOMBOL */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={runSegment}
                    disabled={loading || !imageFile}
                    className="flex-1 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Memproses..." : "Deteksi Banjir"}
                  </button>
                  {(imageFile || result) && (
                    <button
                      type="button"
                      onClick={reset}
                      className="px-4 py-3 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400"
                    >
                      Reset
                    </button>
                  )}
                </div>

              </div>

              {/* KOLOM KANAN: HASIL */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow border">

                {!result && (
                  <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <Droplets className="w-10 h-10 text-gray-200" />
                    <span>Hasil deteksi akan muncul di sini</span>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">

                    {/* PERSENTASE BANJIR */}
                    {pct != null && colors ? (
                      <div className={`rounded-2xl border p-5 text-center ${colors.bg}`}>
                        <p className={`text-5xl font-bold ${colors.text}`}>
                          {pct.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500 mt-1">citra terdampak banjir</p>
                        <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
                          {floodLevel(pct)}
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-400">
                        Persentase banjir tidak tersedia
                      </div>
                    )}

                    {/* TABS GAMBAR */}
                    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                      {(["overlay", "mask", "original"] as const).map((tab) => (
                        <button
                          type="button"
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-t transition
                            ${activeTab === tab
                              ? "bg-indigo-500 text-white"
                              : "text-gray-500 hover:text-indigo-600"}`}
                        >
                          {tab === "overlay" ? "Overlay" : tab === "mask" ? "Mask" : "Asli"}
                        </button>
                      ))}
                    </div>

                    <img
                      src={`data:image/png;base64,${
                        activeTab === "overlay"  ? result.overlay_image   :
                        activeTab === "mask"     ? result.segmented_image :
                                                  result.original_image
                      }`}
                      alt={activeTab}
                      className="w-full max-h-64 object-contain rounded-xl bg-gray-50 dark:bg-slate-800 p-2"
                    />

                    <div className="flex justify-between text-xs text-gray-400">
                      <span>
                        Metode: <b>{METHOD_LABEL[result.method] ?? result.method}</b>
                      </span>
                      {latency != null && (
                        <span>Waktu inferensi: <b>{latency} ms</b></span>
                      )}
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </section>

    </PublicLayout>
  );
}
