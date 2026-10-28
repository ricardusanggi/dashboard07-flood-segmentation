import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import { AlertTriangle, Database, Trash2, HardDrive } from "lucide-react";

import { dockerCleanup, dockerOverview } from "../../api/adminSystem";

const CONFIRM_TEXT = "CLEAN DOCKER";

export default function SystemDockerCleanupComponent() {

  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [dockerStats, setDockerStats] = useState({
    images: "-",
    containers: "-",
    volumes: "-",
    build_cache: "-"
  });

  const konfirmasiBenar = confirmText.trim() === CONFIRM_TEXT;
  const bisaCleanup = konfirmasiBenar && acknowledged && !loading;

  /* ================= LOAD DOCKER STATS ================= */

  useEffect(() => {

    async function loadStats() {

      try {

        setStatsLoading(true);

        const data = await dockerOverview();

        console.log("Docker stats:", data);

        setDockerStats({
          images: data.images ?? "-",
          containers: data.containers ?? "-",
          volumes: data.volumes ?? "-",
          build_cache: data.build_cache ?? "-"
        });

      } catch (err) {

        console.error("Failed load docker stats:", err);

      } finally {

        setStatsLoading(false);

      }

    }

    loadStats();

  }, []);

  /* ================= RUN CLEANUP ================= */

  async function runCleanup() {

    setShowModal(false);
    setShowProgress(true);

    try {

      setLoading(true);

      await dockerCleanup();

      toast.success("Docker cleanup berhasil dijalankan.");

      setTimeout(() => {

        setShowProgress(false);

        setConfirmText("");
        setAcknowledged(false);

        window.location.reload();

      }, 1500);

    } catch (err) {

      console.error(err);

      toast.error("Docker cleanup gagal.");

      setShowProgress(false);

    } finally {

      setLoading(false);

    }

  }

  function handleInput(value: string) {
    setConfirmText(value.toUpperCase());
  }

  return (

    <div className="max-w-4xl mx-auto space-y-8">

      {/* ================= DOCKER RESOURCE STATS ================= */}

      <Card className="p-6 space-y-4">

        <div className="flex items-center gap-2 font-semibold text-lg">
          <HardDrive size={18}/>
          Docker Resource Usage
        </div>

        {statsLoading ? (

          <div className="text-sm text-gray-500">
            Memuat informasi Docker...
          </div>

        ) : (

          <div className="grid grid-cols-4 gap-4">

            <StatCard title="Images" value={dockerStats.images}/>
            <StatCard title="Containers" value={dockerStats.containers}/>
            <StatCard title="Volumes" value={dockerStats.volumes}/>
            <StatCard title="Build Cache" value={dockerStats.build_cache}/>

          </div>

        )}

      </Card>


      {/* ================= WARNING ================= */}

      <Card className="border border-green-300 bg-green-50 dark:bg-green-950/30 p-6">

        <div className="flex gap-4">

          <AlertTriangle className="text-green-600" size={22}/>

          <div>

            <h3 className="font-semibold text-green-700">
              Operasi Administratif Sensitif
            </h3>

            <p className="text-sm mt-1">

              Sistem akan menghapus container, image, volume,
              serta build cache Docker yang tidak digunakan.

            </p>

            <p className="text-sm font-semibold mt-2 text-green-700">
              Tindakan ini tidak dapat dibatalkan.
            </p>

          </div>

        </div>

      </Card>


      {/* ================= MAIN PANEL ================= */}

      <Card className="p-8 space-y-6">

        <div className="flex items-start gap-3 text-sm text-gray-600">

          <Database size={18}/>

          <div>

            <p>
              Docker dapat menyimpan container, image, volume,
              dan cache yang tidak lagi digunakan oleh sistem.
            </p>

            <p className="mt-1">
              Cleanup akan menghapus resource tersebut untuk
              menghemat ruang penyimpanan server.
            </p>

          </div>

        </div>


        {/* CHECKBOX */}

        <div className="flex items-start gap-3 pt-4 border-t">

          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />

          <span className="text-sm">
            Saya memahami bahwa proses ini akan menghapus resource Docker
            yang tidak digunakan oleh sistem.
          </span>

        </div>


        {/* CONFIRM INPUT */}

        {acknowledged && (

          <div className="space-y-3">

            <p className="text-sm">
              Ketik <b>CLEAN DOCKER</b> untuk melanjutkan proses cleanup.
            </p>

            <input
              value={confirmText}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="CLEAN DOCKER"
              className="w-full p-3 rounded-lg border"
            />

          </div>

        )}


        {/* BUTTON */}

        <div className="flex justify-end pt-6 border-t">

          <Button
            disabled={!bisaCleanup}
            onClick={() => setShowModal(true)}
            className={
              bisaCleanup
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-300 text-gray-500"
            }
          >
            <Trash2 size={16}/>
            Jalankan Docker Cleanup
          </Button>

        </div>

      </Card>


      {/* ================= CONFIRM MODAL ================= */}

      {showModal && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl w-[420px] shadow-lg p-6 space-y-4">

            <h3 className="text-lg font-semibold text-red-600">
              Konfirmasi Docker Cleanup
            </h3>

            <p className="text-sm">
              Sistem akan membersihkan container, image, volume,
              dan build cache Docker yang tidak digunakan.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t">

              <Button onClick={() => setShowModal(false)}>
                Batal
              </Button>

              <Button
                onClick={runCleanup}
                className="bg-red-600 text-white"
              >
                Jalankan
              </Button>

            </div>

          </div>

        </div>

      )}


      {/* ================= CLEANUP PROGRESS ================= */}

      {showProgress && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white p-8 rounded-2xl text-center space-y-4 w-[340px]">

            <div className="animate-spin text-3xl">🐳</div>

            <h3 className="font-semibold">
              Membersihkan Resource Docker
            </h3>

            <p className="text-sm text-gray-500">
              Container, image, volume, dan cache sedang dibersihkan.
            </p>

          </div>

        </div>

      )}

    </div>

  );

}


/* ================= STAT CARD ================= */

function StatCard({ title, value }: { title: string; value: string }) {

  return (

    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-center border">

      <div className="text-xs text-gray-500">
        {title}
      </div>

      <div className="text-lg font-semibold mt-1">
        {value}
      </div>

    </div>

  );

}