// path: frontend/src/pages/admin/SystemResetComponent.tsx

import { useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { resetPreview, resetSystem } from "../../api/adminSystem";
import toast from "react-hot-toast";
import { AlertTriangle, Database, Trash2 } from "lucide-react";

interface ResetPreview {
  files_to_delete: number;
  directories_to_delete: number;
}

const CONFIRM_TEXT = "RESET SYSTEM";

export default function SystemResetComponent() {

  const [preview, setPreview] = useState<ResetPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const [loading, setLoading] = useState(false);

  const konfirmasiBenar = confirmText.trim() === CONFIRM_TEXT;
  const bisaReset = konfirmasiBenar && acknowledged && !loading;

  /* ================= LOAD PREVIEW ================= */

  async function loadPreview() {

    try {

      setPreviewLoading(true);

      const data = await resetPreview();

      setPreview({
        files_to_delete: data?.files_to_delete ?? 0,
        directories_to_delete: data?.directories_to_delete ?? 0
      });

    } catch (err) {

      console.error(err);

      toast.error("Gagal mengambil ringkasan data reset.");

    } finally {

      setPreviewLoading(false);

    }

  }

  /* ================= EXECUTE RESET ================= */

  async function executeReset() {

    setShowModal(false);
    setShowProgress(true);

    try {

      setLoading(true);

      const result = await resetSystem();

      toast.success("Reset sistem berhasil dijalankan.");

      if (result?.result) {

        toast(
          `Dihapus ${result.result.training_deleted} data pelatihan dan ${result.result.models_deleted} model.`
        );

      }

      setTimeout(() => {

        setShowProgress(false);
        setConfirmText("");
        setAcknowledged(false);
        setPreview(null);

      }, 2000);

    } catch (err: any) {

      toast.error(
        err?.response?.data?.detail ||
        "Proses reset sistem gagal."
      );

      setShowProgress(false);

    } finally {

      setLoading(false);

    }

  }

  function handleInput(value: string) {
    setConfirmText(value.toUpperCase());
  }

  return (

    <div className="max-w-3xl mx-auto space-y-8">

      {/* ================= HEADER ================= */}

      <div>

        <h1 className="text-2xl font-semibold">
          Reset Sistem
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Menghapus seluruh dataset, model segmentasi, dan data pelatihan sistem.
        </p>

      </div>


      {/* ================= WARNING ================= */}

      <Card className="border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-6">

        <div className="flex items-start gap-3">

          <AlertTriangle className="text-red-600 mt-1" size={22} />

          <div>

            <h2 className="font-semibold text-red-700 dark:text-red-400">
              Operasi Reset Sistem
            </h2>

            <p className="text-sm mt-1">

              Proses ini akan menghapus seluruh dataset citra,
              model segmentasi, riwayat pelatihan,
              serta log sistem yang tersimpan.

            </p>

            <p className="text-sm mt-2 font-semibold text-red-700">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>

          </div>

        </div>

      </Card>


      {/* ================= MAIN CARD ================= */}

      <Card className="p-8 space-y-6 border border-gray-200 dark:border-gray-800">

        <div className="flex items-start gap-3 text-sm text-gray-600">

          <Database size={18} className="mt-1 text-gray-400" />

          <p>
            Administrator dapat meninjau jumlah data yang akan dihapus
            sebelum menjalankan proses reset sistem.
          </p>

        </div>


        {/* PREVIEW BUTTON */}

        <button
          disabled={previewLoading}
          onClick={loadPreview}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >

          <Database size={16} />

          Tampilkan Ringkasan Data

        </button>


        {previewLoading && (

          <div className="text-sm animate-pulse text-gray-500">
            Mengambil ringkasan data...
          </div>

        )}


        {/* PREVIEW RESULT */}

        {preview && (

          <div className="grid grid-cols-2 gap-4">

            <div className="p-4 rounded-xl border text-center bg-gray-50">

              <div className="text-xs text-gray-500">
                File yang akan dihapus
              </div>

              <div className="text-xl font-semibold">
                {preview.files_to_delete}
              </div>

            </div>

            <div className="p-4 rounded-xl border text-center bg-gray-50">

              <div className="text-xs text-gray-500">
                Folder yang akan dihapus
              </div>

              <div className="text-xl font-semibold">
                {preview.directories_to_delete}
              </div>

            </div>

          </div>

        )}


        {/* CONFIRM CHECKBOX */}

        <div className="flex items-start gap-3 pt-4 border-t">

          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />

          <span className="text-sm">
            Saya memahami bahwa reset sistem akan menghapus
            seluruh dataset, model segmentasi, dan data terkait.
          </span>

        </div>


        {/* CONFIRM TEXT */}

        {acknowledged && (

          <div className="space-y-3">

            <p className="text-sm text-gray-600">

              Untuk melanjutkan proses reset sistem ketik

              <b className="mx-1">
                RESET SYSTEM
              </b>

              pada kolom berikut.

            </p>

            <input
              value={confirmText}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="RESET SYSTEM"
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-400"
            />

          </div>

        )}


        {/* RESET BUTTON */}

        <div className="flex justify-end pt-4 border-t">

          <Button
            disabled={!bisaReset}
            onClick={() => setShowModal(true)}
            className={`
              flex items-center gap-2
              h-11 px-6 rounded-xl font-semibold transition
              ${
                bisaReset
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >

            <Trash2 size={16} />

            Jalankan Reset Sistem

          </Button>

        </div>

      </Card>


      {/* ================= MODAL ================= */}

      {showModal && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">

          <div className="modal-pop bg-white rounded-2xl w-[420px] shadow-xl overflow-hidden">

            <div className="bg-red-600 text-white p-6">

              <h3 className="text-lg font-semibold">
                Konfirmasi Reset Sistem
              </h3>

              <p className="text-xs opacity-90">
                Operasi sistem berisiko
              </p>

            </div>

            <div className="p-6 space-y-4">

              <p className="text-sm text-gray-600">

                Sistem akan menghapus seluruh dataset,
                model segmentasi, dan log sistem.

              </p>

              <div className="flex justify-end gap-3 pt-4 border-t">

                <Button
                  onClick={() => setShowModal(false)}
                  className="
                    h-10 px-4
                    border border-gray-300
                    bg-white
                    text-gray-700
                    hover:bg-gray-50
                    rounded-lg
                  "
                >
                  Batal
                </Button>

                <Button
                  onClick={executeReset}
                  className="
                    h-10 px-5
                    bg-red-600
                    hover:bg-red-700
                    text-white
                    rounded-lg
                    font-semibold
                  "
                >
                  Ya, Reset Sistem
                </Button>

              </div>
            </div>

          </div>

        </div>

      )}


      {/* ================= PROGRESS ================= */}

      {showProgress && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-white p-8 rounded-2xl text-center space-y-4">

            <img
              src="/system-reset.png"
              alt="reset-system"
              className="w-20 mx-auto animate-pulse"
            />

            <h3 className="font-semibold">
              Sistem sedang menjalankan reset
            </h3>

            <p className="text-sm text-gray-500">
              Menghapus dataset, model segmentasi, dan data pelatihan...
            </p>

          </div>

        </div>

      )}

    </div>

  );

}