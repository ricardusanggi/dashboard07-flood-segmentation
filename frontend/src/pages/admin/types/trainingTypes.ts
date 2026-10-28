// path: frontend/src/pages/admin/types/trainingTypes.ts

export interface TrainingJob {
  id: number
  started_by: number

  // TRAINING PARAMS
  architecture: string
  epochs: number
  batch_size: number
  learning_rate: number
  optimizer: string
  loss_function: string

  augmentation: boolean
  val_split: number

  // PSO
  use_pso?: boolean
  pso_population?: number
  pso_iters?: number
  pso_best_params?: Record<string, number>
  pso_best_score?: number

  // LOSS
  best_train_loss: number | null
  best_val_loss: number | null

  // METRIK SEGMENTASI (reuse kolom accuracy/precision/recall)
  iou: number | null
  dice: number | null
  pixel_acc: number | null

  // STATUS
  model_id: number | null
  review_status: "running" | "pending" | "approved" | "rejected"

  created_at: string
  updated_at: string
}

export interface TrainingStatusResponse {
  running: boolean
  job: TrainingJob | null
}

// Preview sample segmentasi
export interface PreviewSample {
  image_base64: string
  mask_base64: string
  predicted_base64: string
  iou: number
  dice: number
}

export interface PreviewData {
  summary: {
    train_loss: number | null
    val_loss: number | null
    iou: number | null
    dice: number | null
    pixel_acc: number | null
  }
  samples: PreviewSample[]
  training_plot?: string | null
}

export type StatBadgeProps = {
  value: number
  label: string
}

export type PreviewModalProps = {
  job: TrainingJob
  data: PreviewData | null
  loading: boolean
  onClose: () => void
}

export type MetricsData = {
  epoch: number[]
  train_loss: number[]
  val_loss: number[]
  train_iou: number[]
  val_iou: number[]
  train_dice: number[]
  val_dice: number[]
}

export type TrainingParams = {
  architecture: string
  epochs: number
  batch_size: number
  learning_rate: number
  optimizer: string
  loss_function: string
  augmentation: boolean
  val_split: number
  use_pso: boolean
  pso_population: number
  pso_iters: number
}

