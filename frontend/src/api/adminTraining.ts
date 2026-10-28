// frontend/src/api/adminTraining.ts

import api from "./api";
import publicApi from "./publicApi";

import type {
  TrainingJob,
  TrainingStatusResponse,
  TrainingParams
} from "../pages/admin/types/trainingTypes";


// ======================================================
// AMBIL STATUS TRAINING
// ======================================================

export async function getTrainingStatus(): Promise<TrainingStatusResponse> {
  const res = await publicApi.get("/system/training-status");
  return res.data;
}


// ======================================================
// LIST TRAINING JOBS (NORMALISASI RESPONSE)
// ======================================================

export const listTrainingJobs = async (): Promise<TrainingJob[]> => {
  const res = await api.get("/admin/training/jobs");
  const jobs = res.data || [];

  return jobs.map(
    (j: any): TrainingJob => ({

      // =====================
      // IDENTITAS
      // =====================
      id: j.id,
      started_by: j.started_by,

      created_at: j.created_at,
      updated_at: j.updated_at,

      // =====================
      // STATUS
      // =====================
      review_status: j.review_status ?? j.status ?? "pending",
      model_id: j.model_id ?? null,

      // =====================
      // TRAINING PARAMS
      // =====================
      architecture: j.architecture ?? "resnet18",

      epochs: j.epochs,
      batch_size: j.batch_size,
      learning_rate: j.learning_rate,
      optimizer: j.optimizer,
      loss_function: j.loss_function,

      augmentation: j.augmentation,
      val_split: j.val_split,

      // =====================
      // PSO
      // =====================
      use_pso: j.use_pso ?? false,
      pso_population: j.pso_population ?? null,
      pso_iters: j.pso_iters ?? null,
      pso_best_params: j.pso_best_params ?? null,
      pso_best_score: j.pso_best_score ?? null,

      // =====================
      // LOSS
      // =====================
      best_train_loss: j.best_train_loss ?? null,
      best_val_loss: j.best_val_loss ?? null,

      // =====================
      // METRIK SEGMENTASI
      // accuracy kolom DB → IoU, precision → Dice, recall → Pixel Acc
      // =====================
      iou:       j.iou       ?? j.accuracy  ?? null,
      dice:      j.dice      ?? j.precision ?? null,
      pixel_acc: j.pixel_acc ?? j.recall    ?? null
    })
  );
};


// ======================================================
// MULAI TRAINING BARU
// ======================================================

export const startTrainingJob = async (params: TrainingParams) => {
  const res = await api.post("/admin/train", params);
  return res.data;
};


// ======================================================
// APPROVE TRAINING MODEL
// ======================================================

export type ApproveTrainingResponse = {
  detail: string;
  model_id: number;
  version: number;
};

export const approveTraining = async (
  jobId: number
): Promise<ApproveTrainingResponse> => {

  const res = await api.post(`/admin/review-approve/${jobId}`);
  return res.data;
};


// ======================================================
// REJECT TRAINING
// ======================================================

export type RejectTrainingResponse = {
  detail: string;
};

export const rejectTraining = async (
  jobId: number
): Promise<RejectTrainingResponse> => {

  const res = await api.post(`/admin/review-reject/${jobId}`);
  return res.data;
};


// ======================================================
// PREVIEW TRAINING JOB
// ======================================================

export const previewTrainingJob = async (
  jobId: number,
  sampleCount = 3
) => {

  const res = await api.get(
    `/admin/training/preview/${jobId}?sample_count=${sampleCount}`
  );

  return res.data;
};


// ======================================================
// GET TRAINING CONFIG
// ======================================================

export const getTrainingConfig = async () => {
  const res = await api.get("/admin/training/config");
  return res.data;
};


// ======================================================
// GET TRAINING METRICS HISTORY
// ======================================================

export const getTrainingMetrics = async (jobId: number) => {
  const res = await api.get(`/admin/training/metrics/${jobId}`);
  return res.data;
};