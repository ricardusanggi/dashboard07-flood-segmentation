// src/pages/admin/ModelsPageViewVersion.tsx

import Card from "../../components/ui/Card";
import { RotateCcw, Clock } from "lucide-react";
import type { ModelItem } from "./types/modelTypes";

type Props = {
  models: ModelItem[];
  canRollback: boolean;
  handleRollback: () => void;
};

export default function ModelsPageViewVersion({
  models,
  canRollback,
  handleRollback
}: Props) {

  return (
    <div className="space-y-6">

      {/* ================= ROLLBACK PANEL ================= */}

      <Card className="p-6 border dark:border-gray-800 dark:bg-gray-900">

        <div className="flex items-start justify-between gap-4">

          <div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Model Rollback
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Mengembalikan sistem ke versi model AI sebelumnya apabila
              model terbaru mengalami penurunan performa atau error
              pada proses segmentasi citra banjir.
            </p>

          </div>

          <RotateCcw className="text-gray-400" size={22} />

        </div>

        <button
          onClick={handleRollback}
          disabled={!canRollback}
          className={`
            mt-5
            w-full
            py-3
            rounded-lg
            text-sm
            font-semibold
            transition
            ${
              canRollback
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-400 cursor-not-allowed text-white"
            }
          `}
        >
          Rollback ke Model Sebelumnya
        </button>

      </Card>


      {/* ================= VERSION HISTORY ================= */}

      <Card className="p-6 border dark:border-gray-800 dark:bg-gray-900">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Riwayat Versi Model
          </h3>

          <Clock size={18} className="text-gray-400" />

        </div>

        {models.length === 0 ? (

          <div className="text-center py-10 text-gray-500">
            Belum ada model AI yang tersedia.
          </div>

        ) : (

          <div className="space-y-4">

            {models.map((m) => (

              <div
                key={m.id}
                className="
                  flex
                  justify-between
                  items-center
                  border
                  rounded-xl
                  p-4
                  hover:bg-gray-50
                  dark:hover:bg-gray-800
                  dark:border-gray-700
                  transition
                "
              >

                {/* MODEL INFO */}

                <div className="space-y-1">

                  <div className="flex items-center gap-2">

                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {m.name}
                    </div>

                    {m.is_active && (
                      <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                        ACTIVE
                      </span>
                    )}

                  </div>

                  <div className="text-sm text-gray-500">
                    Versi {m.version}
                  </div>

                  <div className="text-xs text-gray-400">
                    {formatDate(m.created_at)}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </Card>

    </div>
  );
}


/* ================= FORMAT DATE ================= */

function formatDate(date?: string) {

  if (!date) return "-";

  try {

    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  } catch {

    return date;

  }

}