// path: frontend/src/pages/admin/TrainingPageView.tsx
// path: frontend/src/pages/admin/TrainingPageView.tsx

import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";
import Spinner from "../../components/Spinner";
import Button from "../../components/ui/Button";
import { Th } from "../../components/ui/TableCell";

import {
  StatusBadge,
  ParamsBadge,
  MetricsTable,
  PreviewModal,
  ControlInput,
  ControlSelect
} from "./TrainingPageComponents";

import type {
  TrainingJob,
  TrainingStatusResponse,
  PreviewData,
  TrainingParams
} from "./types/trainingTypes";

type Props = {
  loading: boolean
  status: TrainingStatusResponse | null
  jobs: TrainingJob[]

  params: TrainingParams
  setParams: (p: TrainingParams) => void

  previewJob: TrainingJob | null
  previewData: PreviewData | null

  loadingPreview: boolean
  setPreviewJob: (v: TrainingJob | null) => void

  handleStart: () => void
  handleApprove: (job: TrainingJob) => void
  handleReject: (id: number) => void
  openPreview: (job: TrainingJob) => void

  isMetricsReady: (job: TrainingJob) => boolean
};

export default function TrainingPageView({
  loading,
  status,
  jobs,
  params,
  setParams,
  previewJob,
  previewData,
  loadingPreview,
  setPreviewJob,
  handleStart,
  handleApprove,
  handleReject,
  openPreview,
  isMetricsReady
}: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const running = Boolean(status?.running);
  const safeJobs = jobs ?? [];

  return (
    <Section title="🌊 Manajemen Training Model Segmentasi Banjir">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT PANEL ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* STATUS */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Training Status
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current training pipeline state
                </p>
              </div>

              {running ? (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  Running
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Idle
                </div>
              )}
            </div>
          </Card>

          {/* ================= HISTORY ================= */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Training History
              </h2>

              <span className="text-sm text-gray-400 dark:text-gray-500">
                {safeJobs.length} jobs
              </span>
            </div>

            {safeJobs.length === 0 ? (
              <div className="text-center py-14 text-gray-500 dark:text-gray-400">
                No training job available
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-800">
                  {/* HEADER */}
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <Th>ID</Th>
                      <Th>Status</Th>
                      <Th>Parameters</Th>
                      <Th>Metrics</Th>
                      <Th>Model</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {safeJobs.map((j) => {
                      const metricsReady = isMetricsReady(j);

                      return (
                        <tr
                          key={j.id}
                          className="
                            bg-white dark:bg-slate-900
                            hover:bg-gray-50 dark:hover:bg-slate-800
                            transition
                          "
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            #{j.id}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge status={j.review_status} />
                          </td>

                          <td className="px-4 py-3 align-top">
                            <ParamsBadge job={j} />
                          </td>

                          <td className="px-4 py-3">
                            <MetricsTable job={j} />
                          </td>

                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {j.model_id ? `Model #${j.model_id}` : "-"}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              {/* PREVIEW */}
                              <button
                                disabled={!j.model_id}
                                onClick={() => j.model_id && openPreview(j)}
                                className={`px-3 py-1 rounded text-xs font-medium transition ${
                                  j.model_id
                                    ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60"
                                    : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                                }`}
                              >
                                Preview
                              </button>

                              {/* APPROVE */}
                              {j.review_status === "pending" && (
                                <>
                                  <button
                                    disabled={!metricsReady}
                                    onClick={() => handleApprove(j)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                                      metricsReady
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                                    }`}
                                  >
                                    Approve
                                  </button>

                                  {/* REJECT */}
                                  <button
                                    onClick={() => handleReject(j.id)}
                                    className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        {!running && (
          <Card className="p-6 space-y-5">

            {/* TITLE */}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Konfigurasi Training Segmentasi
            </h2>

            {/* ================= BASIC PARAMETERS ================= */}

            <div className="space-y-3">

              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Parameter Dasar
              </h3>

              {/* MODEL ARCHITECTURE */}
              <ControlSelect
                label="Arsitektur Model Segmentasi"
                value={params.architecture}
                options={[
                  "unet",
                  "unet_resnet18",
                  "unet_resnet34",
                  "unet_resnet50",
                  "unet_resnet101",
                  "deeplab",
                  "deeplab_resnet50",
                  "deeplab_resnet101",
                  "deeplab_mobilenet",
                ]}
                labels={[
                  "U-Net (vanilla, tanpa pretrained)",
                  "U-Net + ResNet-18 (pretrained, ringan)",
                  "U-Net + ResNet-34 (pretrained, seimbang) ★",
                  "U-Net + ResNet-50 (pretrained, akurat)",
                  "U-Net + ResNet-101 (pretrained, paling dalam)",
                  "DeepLabV3+ ResNet-50 (pretrained)",
                  "DeepLabV3+ ResNet-50 (sama dengan deeplab)",
                  "DeepLabV3+ ResNet-101 (pretrained, lebih dalam)",
                  "DeepLabV3+ MobileNetV3 (pretrained, ringan)",
                ]}
                onChange={(v: string) =>
                  setParams({ ...params, architecture: v })
                }
              />

              {/* GRID PARAMETERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <ControlInput
                  label="Epochs"
                  value={params.epochs}
                  min={1}
                  step={1}
                  onChange={(v: number) =>
                    setParams({ ...params, epochs: v })
                  }
                />

                <ControlInput
                  label="Batch Size"
                  value={params.batch_size}
                  min={1}
                  step={1}
                  onChange={(v: number) =>
                    setParams({ ...params, batch_size: v })
                  }
                />

                <ControlInput
                  label="Learning Rate"
                  value={params.learning_rate}
                  step={0.00001}
                  onChange={(v: number) =>
                    setParams({ ...params, learning_rate: v })
                  }
                />

                <ControlSelect
                  label="Optimizer"
                  value={params.optimizer}
                  options={[
                    "adam",
                    "sgd",
                    "rmsprop",
                    "adamw",
                    "adadelta",
                    "adamax",
                    "nadam"
                  ]}
                  onChange={(v: string) =>
                    setParams({ ...params, optimizer: v })
                  }
                />

                <ControlSelect
                  label="Loss Function"
                  value={params.loss_function}
                  options={["bce_dice", "bce", "dice", "iou"]}
                  labels={[
                    "BCE + Dice (rekomendasi)",
                    "Binary Cross Entropy",
                    "Dice Loss",
                    "IoU Loss"
                  ]}
                  onChange={(v: string) =>
                    setParams({ ...params, loss_function: v })
                  }
                />

                <ControlInput
                  label="Validation Split"
                  value={params.val_split}
                  step={0.05}
                  onChange={(v: number) =>
                    setParams({ ...params, val_split: v })
                  }
                />

              </div>

              {/* AUGMENTATION */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={params.augmentation}
                  onChange={(e) =>
                    setParams({ ...params, augmentation: e.target.checked })
                  }
                  className="accent-green-600"
                />

                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Enable Data Augmentation
                </span>
              </div>

            </div>

            {/* ================= PSO ================= */}

            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-3">

              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                PSO Hyperparameter Search (Opsional)
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={params.use_pso}
                  onChange={(e) =>
                    setParams({ ...params, use_pso: e.target.checked })
                  }
                  className="accent-green-600"
                />

                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Enable Particle Swarm Optimization
                </span>
              </div>

              {params.use_pso && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  <ControlInput
                    label="PSO Population"
                    value={params.pso_population}
                    min={2}
                    step={1}
                    onChange={(v: number) =>
                      setParams({ ...params, pso_population: v })
                    }
                  />

                  <ControlInput
                    label="PSO Iterations"
                    value={params.pso_iters}
                    min={1}
                    step={1}
                    onChange={(v: number) =>
                      setParams({ ...params, pso_iters: v })
                    }
                  />

                </div>
              )}

            </div>

            {/* ================= START BUTTON ================= */}

            <Button
              className="w-full mt-3 py-3 text-base font-semibold bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 shadow-lg"
              disabled={running || loading}
              onClick={handleStart}
            >
              {running ? "Training Berjalan..." : "Mulai Training Segmentasi"}
            </Button>

          </Card>
        )}
        
      </div>

      {/* ================= PREVIEW MODAL ================= */}

      {previewJob && (
        <PreviewModal
          job={previewJob}
          data={previewData}
          loading={loadingPreview}
          onClose={() => setPreviewJob(null)}
        />
      )}
    </Section>
  );
}
