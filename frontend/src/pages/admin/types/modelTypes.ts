// path frontend/src/pages/admin/types/modelTypes.ts

// ================= REVIEW STATUS =================
export type ReviewStatus = "pending" | "approved" | "rejected";

// ================= MODEL METRICS (SEGMENTASI) =================
export type ModelMetrics = {
  iou: number | null;
  dice: number | null;
  pixel_acc: number | null;
};

// ================= MODEL ITEM (LIST) =================
export type ModelItem = {
  id: number;
  name: string;
  version: string;
  path: string;

  review_status: ReviewStatus;
  is_active: boolean;

  created_at?: string;
  architecture?: string;

  // Metrik segmentasi (reuse kolom accuracy/precision/recall di DB)
  accuracy: number | null;   // → IoU
  precision: number | null;  // → Dice
  recall: number | null;     // → Pixel Acc
  f1: number | null;         // tidak digunakan
};

// ================= ACTIVE MODEL RESPONSE =================
export type ActiveModel =
  | { active: null }
  | (ModelItem & { active: true });
