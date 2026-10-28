// frontend/src/pages/user/DashboardUserViewPrediction.tsx

import { useEffect, useState, useRef } from "react";
import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { UploadCloud, Layers, Brain } from "lucide-react";
import { segmentImage, getSegmentationMethodInfo } from "../../api/predictApi";

type SegmentationResult = {
  method: string;
  segmented_image: string;
  overlay_image: string;
  original_image: string;
  metrics?: {
    iou: number;
    dice: number;
    pixel_acc: number;
  };
};

const METHOD_LABEL: Record<string, string> = {
  otsu:      "Otsu Thresholding",
  adaptive:  "Adaptive Thresholding",
  watershed: "Watershed",
  kmeans:    "K-Means Clustering",
  unet:      "U-Net (Deep Learning)",
};

export default function DashboardUserViewPrediction() {

  const imageInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef  = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maskFile,  setMaskFile]  = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [maskPreview,  setMaskPreview]  = useState<string | null>(null);

  const [result,  setResult]  = useState<SegmentationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [methodInfo,    setMethodInfo]    = useState<any>(null);
  const [checkingModel, setCheckingModel] = useState(true);
  const [activeTab,     setActiveTab]     = useState<"overlay"|"mask"|"original">("overlay");

  /* ===== load info metode ===== */
  async function loadMethodInfo() {
    try {
      setCheckingModel(true);
      const info = await getSegmentationMethodInfo();
      setMethodInfo(info);
    } catch (err) {
      console.warn("Gagal memuat info metode", err);
      setMethodInfo(null);
    } finally {
      setCheckingModel(false);
    }
  }

  useEffect(() => { loadMethodInfo(); }, []);

  /* ===== cleanup blob URL ===== */
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (maskPreview)  URL.revokeObjectURL(maskPreview);
    };
  }, [imagePreview, maskPreview]);

  /* ===== model unet belum aktif? ===== */
  const unetNotReady =
    methodInfo?.method === "unet" && !methodInfo?.model_active;

  /* ===== handler file citra asli ===== */
  function handleImageChange(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { alert("File harus berupa gambar."); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setResult(null);
  }

  /* ===== handler file mask ===== */
  function handleMaskChange(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { alert("File mask harus berupa gambar."); return; }
    setMaskFile(f);
    setMaskPreview(URL.createObjectURL(f));
    setResult(null);
  }

  /* ===== reset ===== */
  function reset() {
    setImageFile(null); setImagePreview(null);
    setMaskFile(null);  setMaskPreview(null);
    setResult(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (maskInputRef.current)  maskInputRef.current.value  = "";
  }

  /* ===== jalankan segmentasi ===== */
  async function handleSegment() {
    if (!imageFile) { alert("Pilih citra asli terlebih dahulu."); return; }
    if (unetNotReady) { alert("Model U-Net belum aktif."); return; }

    setLoading(true);
    setResult(null);

    try {
      const res = await segmentImage(imageFile, maskFile);
      setResult(res);
      setActiveTab("overlay");
    } catch (err: any) {
      alert(
        "Gagal segmentasi: " +
        (err?.response?.data?.detail ?? err?.message ?? "Terjadi kesalahan")
      );
    } finally {
      setLoading(false);
    }
  }

  const methodLabel = methodInfo ? (METHOD_LABEL[methodInfo.method] ?? methodInfo.method) : "-";

  return (
    <Section title="Segmentasi Citra">

      <div className="max-w-4xl mx-auto space-y-6">

        {/* STATUS MODEL */}
        {checkingModel && (
          <div className="text-center text-sm text-gray-500">
            Memeriksa metode segmentasi...
          </div>
        )}

        {!checkingModel && unetNotReady && (
          <div className="p-5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300 flex gap-3">
            <Brain size={20} className="mt-0.5 shrink-0"/>
            <div>
              <p className="font-semibold">Model U-Net Belum Tersedia</p>
              <p className="text-xs mt-1">
                Metode aktif adalah <b>U-Net</b> namun belum ada model yang diaktifkan admin.
                Hubungi admin atau pilih metode klasik di <code>.env</code>.
              </p>
            </div>
          </div>
        )}

        {/* BADGE METODE */}
        {!checkingModel && methodInfo && (
          <div className="flex items-center gap-2 text-sm">
            <Layers size={16} className="text-indigo-500"/>
            <span className="text-gray-600 dark:text-gray-400">Metode aktif:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {methodLabel}
            </span>
          </div>
        )}

        {/* FORM INPUT */}
        <Card className="p-6 rounded-3xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5">

          {/* ---- CITRA ASLI ---- */}
          <div>
            <p className="font-semibold text-sm mb-2">Citra Asli <span className="text-red-500">*</span></p>

            {!imagePreview ? (
              <div
                onClick={() => imageInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); handleImageChange(e.dataTransfer.files?.[0] ?? null); }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer border-gray-300 hover:border-indigo-500 dark:border-gray-700 transition"
              >
                <UploadCloud size={32} className="mx-auto text-gray-400 mb-2"/>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unggah Citra Asli</p>
                <p className="text-xs text-gray-400 mt-1">Klik atau seret gambar ke sini</p>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                  title="Pilih citra asli" aria-label="Unggah citra asli"
                  onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}/>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="cursor-pointer text-indigo-600 hover:underline font-medium">
                    Ganti
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}/>
                  </label>
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-red-500 hover:underline">Hapus</button>
                </div>
                <img src={imagePreview} alt="Preview citra asli"
                  className="w-full max-h-52 object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-2"/>
              </div>
            )}
          </div>

          {/* ---- MASK GT (OPSIONAL) ---- */}
          <div>
            <p className="font-semibold text-sm mb-1">
              Mask Ground-Truth
              <span className="ml-2 text-xs font-normal text-gray-400">(opsional — untuk menghitung IoU & Dice)</span>
            </p>

            {!maskPreview ? (
              <div
                onClick={() => maskInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); handleMaskChange(e.dataTransfer.files?.[0] ?? null); }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer border-gray-200 hover:border-indigo-400 dark:border-gray-700 transition"
              >
                <UploadCloud size={24} className="mx-auto text-gray-300 mb-1"/>
                <p className="text-xs text-gray-400">Unggah mask biner (opsional)</p>
                <input ref={maskInputRef} type="file" accept="image/*" className="hidden"
                  title="Pilih mask ground-truth" aria-label="Unggah mask ground-truth"
                  onChange={(e) => handleMaskChange(e.target.files?.[0] ?? null)}/>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="cursor-pointer text-indigo-600 hover:underline font-medium">
                    Ganti
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleMaskChange(e.target.files?.[0] ?? null)}/>
                  </label>
                  <button type="button" onClick={() => { setMaskFile(null); setMaskPreview(null); }} className="text-red-500 hover:underline">Hapus</button>
                </div>
                <img src={maskPreview} alt="Preview mask"
                  className="w-full max-h-40 object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-2"/>
              </div>
            )}
          </div>

          {/* ---- TOMBOL ---- */}
          <div className="flex gap-3">
            <Button
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              onClick={handleSegment}
              disabled={loading || !imageFile || unetNotReady}
            >
              {loading ? "⏳ Memproses..." : "Jalankan Segmentasi"}
            </Button>

            {(imageFile || result) && (
              <Button
                className="px-5 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={reset}
              >
                Reset
              </Button>
            )}
          </div>

        </Card>

        {/* HASIL SEGMENTASI */}
        {result && (
          <Card className="p-6 rounded-3xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5">

            <h3 className="font-bold text-lg">Hasil Segmentasi</h3>

            {/* METRIK */}
            {result.metrics && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "IoU",        value: result.metrics.iou,       color: "indigo" },
                  { label: "Dice",       value: result.metrics.dice,      color: "purple" },
                  { label: "Pixel Acc.", value: result.metrics.pixel_acc, color: "teal"   },
                ].map(({ label, value, color }) => (
                  <div key={label}
                    className={`rounded-2xl p-4 text-center bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800`}
                  >
                    <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                      {(value * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TABS GAMBAR */}
            <div>
              <div className="flex gap-1 mb-3 border-b border-gray-200 dark:border-gray-700">
                {(["overlay","mask","original"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition
                      ${activeTab === tab
                        ? "bg-indigo-500 text-white"
                        : "text-gray-500 hover:text-indigo-600 dark:text-gray-400"}`}
                  >
                    {tab === "overlay" ? "Overlay" : tab === "mask" ? "Mask" : "Asli"}
                  </button>
                ))}
              </div>

              <img
                key={activeTab}
                src={`data:image/png;base64,${
                  activeTab === "overlay"  ? result.overlay_image   :
                  activeTab === "mask"     ? result.segmented_image  :
                                            result.original_image
                }`}
                alt={activeTab}
                className="w-full max-h-72 object-contain rounded-2xl bg-gray-50 dark:bg-gray-800 p-3"
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Metode: <span className="font-medium">{METHOD_LABEL[result.method] ?? result.method}</span>
            </p>

          </Card>
        )}

      </div>
    </Section>
  );
}
