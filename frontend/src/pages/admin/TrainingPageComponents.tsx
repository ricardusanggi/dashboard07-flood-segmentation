// path: frontend/src/pages/admin/TrainingPageComponents.tsx

import { memo, useEffect, useState } from "react";
import Spinner from "../../components/Spinner";
import TrainingMetricsChart from "./TrainingMetricsChart";
import { getTrainingMetrics } from "../../api/adminTraining";

import type {
  TrainingJob,
  PreviewSample,
  PreviewModalProps,
  StatBadgeProps,
  MetricsData
} from "./types/trainingTypes";


/* ================= STATUS BADGE ================= */

type Status = "running" | "pending" | "approved" | "rejected";

export const StatusBadge = memo(function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    running: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-cyan-100 text-cyan-700",
    rejected: "bg-red-100 text-red-700"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${styles[status]}`}>
      {status}
    </span>
  );
});


/* ================= PARAM BADGE ================= */

export const ParamsBadge = memo(function ParamsBadge({ job }: { job: TrainingJob }) {
  const p: any = job.params ?? job;

  return (
    <div className="text-[11px] space-y-1 text-left">
      <div>
        🌱 Epochs: <b>{p.epochs}</b>
      </div>

      <div>
        📦 Batch: <b>{p.batch_size}</b>
      </div>

      <div>
        ⚡ LR: <b>{p.learning_rate}</b>
      </div>

      <div>
        🧠 Opt: <b>{p.optimizer}</b>
      </div>

      <div>
        🧪 Loss: <b>{p.loss_function}</b>
      </div>

      <div>
        🔀 Aug:
        <span
          className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            p.augmentation
              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {p.augmentation ? "ON" : "OFF"}
        </span>
      </div>

      <div>
        📊 Val: <b>{p.val_split}</b>
      </div>

      {/* ================= PSO ================= */}

      {p.use_pso && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <div className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-[10px] font-semibold w-fit">
            ⚙ PSO Enabled
          </div>

          <div>
            👥 Pop: <b>{p.pso_population}</b>
          </div>

          <div>
            🔁 Iter: <b>{p.pso_iters}</b>
          </div>

          {p.pso_best_score && (
            <div className="text-purple-600 dark:text-purple-300 font-semibold">
              ⭐ Best Score: {Number(p.pso_best_score).toFixed(4)}
            </div>
          )}
        </div>
      )}
    </div>
  );
});


/* ================= METRICS TABLE ================= */

function format3(v?: number | null) {
  return v !== undefined && v !== null ? v.toFixed(3) : "-";
}

export const MetricsTable = memo(function MetricsTable({ job }: { job: TrainingJob }) {
  return (
    <table className="text-xs mx-auto">
      <tbody>
        <tr><td className="pr-3 py-0.5">Train Loss</td><td>{format3(job.best_train_loss)}</td></tr>
        <tr><td className="pr-3 py-0.5">Val Loss</td>  <td>{format3(job.best_val_loss)}</td></tr>
        <tr><td className="pr-3 py-0.5">IoU</td>       <td>{format3(job.iou)}</td></tr>
        <tr><td className="pr-3 py-0.5">Dice</td>      <td>{format3(job.dice)}</td></tr>
        <tr><td className="pr-3 py-0.5">Pixel Acc.</td><td>{format3(job.pixel_acc)}</td></tr>
      </tbody>
    </table>
  );
});


/* ================= PREVIEW MODAL ================= */

export function PreviewModal({ job, data, loading, onClose }: PreviewModalProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    if (!job?.id) return;

    setLoadingMetrics(true);

    getTrainingMetrics(job.id)
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoadingMetrics(false));

  }, [job]);

  if (loading) {
    return (
      <ModalWrapper>
        <Spinner />
      </ModalWrapper>
    );
  }

  if (!data) {
    return (
      <ModalWrapper>
        <EmptyPreview onClose={onClose} />
      </ModalWrapper>
    );
  }

  if (!data.samples?.length) {
    return (
      <ModalWrapper>
        <EmptyPreview onClose={onClose} />
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper>
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">Preview Training Job #{job.id}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">✖</button>
        </div>

        {/* RINGKASAN METRIK */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "IoU",        v: data.summary.iou },
            { label: "Dice",       v: data.summary.dice },
            { label: "Pixel Acc.", v: data.summary.pixel_acc },
          ].map(({ label, v }) => (
            <div key={label} className="rounded-xl p-3 text-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
              <p className="text-xl font-bold text-indigo-600">
                {v !== null && v !== undefined ? (v * 100).toFixed(1) + "%" : "—"}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* PLOT TRAINING */}
        {data.training_plot && (
          <div className="mb-6">
            <p className="font-semibold text-sm mb-2">Training Curves</p>
            <img
              src={`data:image/png;base64,${data.training_plot}`}
              alt="Training plot"
              className="w-full rounded-xl border"
            />
          </div>
        )}

        {/* METRIK CHART */}
        {metrics && !loadingMetrics && (
          <div className="mb-6">
            <p className="font-semibold text-sm mb-2">Metrik per Epoch</p>
            <TrainingMetricsChart data={metrics} />
          </div>
        )}

        {/* SAMPEL PREVIEW */}
        <p className="font-semibold text-sm mb-3">Sampel Validasi</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.samples.slice(0, 6).map((s, i) => (
            <SegmentationCard key={i} sample={s} />
          ))}
        </div>

      </div>
    </ModalWrapper>
  );
}

/* ================= MODAL WRAPPER ================= */

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      {children}
    </div>
  );
}

/* ================= EMPTY PREVIEW ================= */

function EmptyPreview({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-white p-6 rounded-lg">
      <p className="text-gray-500">Tidak ada data preview</p>
      <button type="button" className="mt-4 px-4 py-2 bg-gray-200 rounded" onClick={onClose}>
        Tutup
      </button>
    </div>
  );
}

/* ================= SEGMENTATION PREVIEW CARD ================= */

function SegmentationCard({ sample }: { sample: PreviewSample }) {
  const [tab, setTab] = useState<"image"|"mask"|"pred">("image");

  const tabs: { key: "image"|"mask"|"pred"; label: string; data: string; mime: string }[] = [
    { key: "image", label: "Citra", data: sample.image_base64, mime: "jpeg" },
    { key: "mask",  label: "Mask",  data: sample.mask_base64,  mime: "png"  },
    { key: "pred",  label: "Pred",  data: sample.predicted_base64, mime: "png" },
  ];

  const iouColor = sample.iou >= 0.7 ? "text-indigo-600" : sample.iou >= 0.5 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="border rounded-xl p-3 shadow-sm bg-white dark:bg-gray-800 space-y-2">
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button type="button" key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-[10px] px-2 py-0.5 rounded transition ${tab === t.key ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-indigo-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => t.key === tab && (
        <img key={t.key} loading="lazy"
          src={`data:image/${t.mime};base64,${t.data}`}
          alt={t.label}
          className="w-full max-h-32 object-contain rounded-lg bg-gray-50 dark:bg-gray-700"
        />
      ))}

      <div className="flex justify-between text-[11px]">
        <span className={`font-semibold ${iouColor}`}>IoU {(sample.iou * 100).toFixed(1)}%</span>
        <span className="text-gray-500">Dice {(sample.dice * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

/* ================= STAT BADGE ================= */

export function StatBadge({ value, label }: StatBadgeProps) {
  const color =
    value >= 0.8
      ? "bg-indigo-100 text-indigo-700"
      : value >= 0.5
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>
      {label} {(value * 100).toFixed(2)}%
    </span>
  );
}

/* ================= INPUT CONTROL ================= */

type ControlInputProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
};

export function ControlInput({ label, value, onChange, min, step }: ControlInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type="number"
        title={label}
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
}

/* ================= SELECT CONTROL ================= */

type ControlSelectProps = {
  label: string;
  value: string;
  options: string[];
  labels?: string[];
  onChange: (v: string) => void;
};

export function ControlSelect({ label, value, options, labels, onChange }: ControlSelectProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <select
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
      >
        {options.map((o, i) => (
          <option key={o} value={o}>
            {labels?.[i] ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}
