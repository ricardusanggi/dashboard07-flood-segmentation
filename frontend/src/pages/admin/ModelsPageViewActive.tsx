import Card from "../../components/ui/Card";
import Spinner from "../../components/Spinner";
import { Activity } from "lucide-react";
import type { ActiveModel } from "./types/modelTypes";

type Props = {
  activeModel: ActiveModel | null;
  loading: boolean;
};

/* =========================================================
   METRIC CARD
========================================================= */

function Metric({
  label,
  value
}: {
  label: string;
  value?: number | null;
}) {

  const formatted =
    value !== undefined && value !== null
      ? Number(value).toFixed(4)
      : "-";

  return (

    <div className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800 text-center">

      <div className="text-xs text-gray-500">
        {label}
      </div>

      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1 tabular-nums">
        {formatted}
      </div>

    </div>

  );

}


/* =========================================================
   ACTIVE MODEL VIEW
========================================================= */

export default function ModelsPageViewActive({
  activeModel,
  loading
}: Props) {

  /* ================= LOADING ================= */

  if (loading) {

    return (

      <Card className="p-10 flex justify-center">

        <Spinner />

      </Card>

    );

  }


  /* ================= EMPTY STATE ================= */

  if (!activeModel) {

    return (

      <Card className="p-10 text-center">

        <div className="flex flex-col items-center gap-3 text-gray-500">

          <Activity size={32} className="opacity-40" />

          <p className="text-sm">
            Belum ada model aktif.
          </p>

          <p className="text-xs text-gray-400">

            Upload dan aktifkan model AI untuk digunakan pada sistem
            segmentasi citra banjir.

          </p>

        </div>

      </Card>

    );

  }


  /* ================= ACTIVE MODEL ================= */

  return (

    <Card className="p-8 space-y-6 border dark:border-gray-800 dark:bg-gray-900">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-2xl font-bold text-green-500">
            {activeModel.name}
          </h3>

          <p className="text-sm text-gray-500">
            Versi {activeModel.version}
          </p>

        </div>

        <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
          ACTIVE
        </div>

      </div>


      {/* MODEL METRICS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Metric
          label="IoU"
          value={activeModel.accuracy}
        />

        <Metric
          label="Dice"
          value={activeModel.precision}
        />

        <Metric
          label="Pixel Acc"
          value={activeModel.recall}
        />

      </div>


      {/* MODEL INFO */}

      <div className="text-xs text-gray-400">

        Model ini digunakan oleh sistem untuk melakukan
        <b> segmentasi citra banjir </b>
        secara otomatis pada proses inferensi.

      </div>

    </Card>

  );

}