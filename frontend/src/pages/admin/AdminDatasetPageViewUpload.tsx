// src/pages/admin/AdminDatasetPageViewUpload.tsx

import { useRef } from "react";
import Card from "../../components/ui/Card";
import { UploadCloud, ChevronDown } from "lucide-react";

type Props = {
  hasPending: boolean;
  selectedFile: File | null;
  uploading: boolean;
  progress: number;
  onSelectFile: (file: File | null) => void;
  onUpload: () => void;
};

export default function AdminDatasetPageViewUpload({
  hasPending,
  selectedFile,
  uploading,
  progress,
  onSelectFile,
  onUpload
}: Props) {

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= VALIDATION ================= */

  function validateFile(file: File | null) {

    if (!file) {
      onSelectFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      alert("File harus berformat .zip");
      return;
    }

    const maxSize = 10240 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Ukuran file maksimal 10240 MB");
      return;
    }

    onSelectFile(file);

  }

  /* ================= DRAG DROP ================= */

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {

    e.preventDefault();

    if (hasPending || uploading) return;

    const file = e.dataTransfer.files?.[0];

    validateFile(file || null);

  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleClick() {

    if (!hasPending && !uploading) {
      fileInputRef.current?.click();
    }

  }

  return (

    <Card className="p-6 shadow-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900">


      {/* ================= PETUNJUK (COLLAPSE) ================= */}

      <details className="mb-6 group rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">

        <summary className="cursor-pointer list-none p-4 flex justify-between items-center font-semibold text-green-700 dark:text-green-300">

          <span>📘 Petunjuk Upload Dataset Segmentasi Banjir</span>

          <ChevronDown
            size={18}
            className="transition group-open:rotate-180"
          />

        </summary>

        <div className="px-5 pb-5">

          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc ml-5">

            <li>File harus dalam format <b>.zip</b></li>

            <li>Dataset segmentasi wajib memiliki <b>dua folder</b>: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">images/</code> dan <code className="bg-green-100 dark:bg-green-900 px-1 rounded">masks/</code></li>

            <li>Struktur folder wajib seperti berikut:</li>

          </ul>


          {/* ================= STRUKTUR DATASET SEGMENTASI ================= */}

          <div className="mt-3 p-3 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed">

            dataset.zip<br />
            └── dataset/<br />
            {"    "}├── images/<br />
            {"    "}│{"   "}├── banjir_001.jpg<br />
            {"    "}│{"   "}├── banjir_002.jpg<br />
            {"    "}│{"   "}└── ...<br />
            {"    "}└── masks/<br />
            {"    "}{"    "}├── banjir_001.png<br />
            {"    "}{"    "}├── banjir_002.png<br />
            {"    "}{"    "}└── ...

          </div>


          <ul className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc ml-5">

            <li>Nama file mask harus <b>sama persis</b> dengan nama file citra (boleh beda ekstensi)</li>

            <li>Format citra: <b>.jpg, .jpeg, .png</b></li>

            <li>Format mask: <b>.png</b> (disarankan)</li>

            <li>Mask berupa citra <b>biner / grayscale</b>: piksel <b>putih (255)</b> = area banjir, piksel <b>hitam (0)</b> = bukan banjir</li>

            <li>Minimal <b>1 pasang</b> citra + mask</li>

            <li>Hindari file selain gambar di dalam kedua folder</li>

          </ul>


          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">

            Dataset ini digunakan untuk melatih model <b>Deep Learning</b>
            dalam melakukan <b>segmentasi citra banjir</b> (U-Net / DeepLabV3+).

          </div>


          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">

            ⚠ Dataset akan melalui proses <b>review admin</b> sebelum digunakan
            dalam proses pelatihan model AI.

          </div>

        </div>

      </details>


      {/* ================= WARNING ================= */}

      {hasPending && (

        <div className="mb-5 p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">

          ⚠️ Kamu masih memiliki dataset yang <b>menunggu persetujuan admin</b>.
          Upload sementara dikunci.

        </div>

      )}


      {/* ================= UPLOAD AREA ================= */}

      <label className="font-semibold text-gray-800 dark:text-gray-200 mb-2 block">

        Upload Dataset Banjir (.zip)

      </label>


      {!selectedFile ? (

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer
            ${
              hasPending || uploading
                ? "opacity-60 cursor-not-allowed border-gray-300 dark:border-gray-700"
                : "border-gray-300 hover:border-green-500 dark:border-gray-700 dark:hover:border-green-500"
            }
          `}
        >

          <UploadCloud size={28} className="mx-auto text-gray-400 mb-2" />

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Drag & Drop dataset_banjir.zip
          </p>

          <p className="text-xs text-gray-400 mt-1">
            atau klik untuk memilih file
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            disabled={hasPending || uploading}
            onChange={(e) => validateFile(e.target.files?.[0] || null)}
            className="hidden"
          />

        </div>

      ) : (

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">

          <div className="flex justify-between items-start">

            <div>

              <div className="font-medium text-gray-700 dark:text-gray-200">
                File dipilih
              </div>

              <div className="text-gray-600 dark:text-gray-400 break-all">
                {selectedFile.name}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>

            </div>

            <button
              onClick={() => onSelectFile(null)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Hapus
            </button>

          </div>

        </div>

      )}


      {/* ================= PROGRESS ================= */}

      {uploading && (

        <div className="mt-5">

          <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-300">

            <span>Mengupload dataset...</span>

            <span>{progress}%</span>

          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">

            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />

          </div>

        </div>

      )}


      {/* ================= BUTTON ================= */}

      <button
        onClick={onUpload}
        disabled={!selectedFile || hasPending || uploading}
        className={`
          w-full mt-6 py-3 rounded-lg text-sm font-semibold transition shadow-sm
          ${
            !selectedFile || hasPending || uploading
              ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed text-white"
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          }
        `}
      >

        {uploading ? "Mengupload Dataset..." : "Upload Dataset"}

      </button>

    </Card>

  );

}