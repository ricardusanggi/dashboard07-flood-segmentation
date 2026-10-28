// path:  frontend/src/pages/admin/types/datasetTypes.ts
// ================= STATUS =================
export type DatasetStatus = "pending" | "approved" | "rejected" | "cancelled" | "merged";

// ================= USER HISTORY =================
export type UserEntry = {
  id: number;
  status: DatasetStatus;
  dataset_folder: string;
  total_images: number;
  upload_number: number;
  upload_time: string;

  uploader_name: string;
  reviewer_name: string | null;

  num_classes: number;
  class_names: string[];
};

// ================= PENDING =================
export type Pending = {
  log_id: number;
  user_id: number;

  uploader_name: string;
  reviewer_name: string | null;

  upload_number: number;
  total_images: number;

  dataset_folder: string;
  status: DatasetStatus;
  upload_time: string;

  num_classes: number;
  class_names: string[];
};

// ================= PREVIEW =================
export type PreviewImage = {
  filename: string;
  image_base64: string;
};

export type PreviewItem = {
  label: string;
  total_images: number;
  images: PreviewImage[];
};

// ================= DATASET STATS =================
export type DatasetStats = {
  total_images: number;
  num_classes: number;

  class_names: string[];

  per_class: Record<string, number>;

  database_total: number;
  folder_total: number;

  is_synced: boolean;

  dataset_health?: {
    imbalance_warning: boolean;
    imbalance_ratio: number;
    missing_classes: string[];
  };
};

// Train stats sama dengan dataset stats
export type TrainStats = DatasetStats;

// ================= MERGE SUMMARY =================
export type MergeSummaryItem = {
  label: string;
  count: number;
};

// ================= HISTORY =================
export type DatasetHistory = {
  id: number;
  user_id: number;

  uploader_name: string;
  reviewer_name: string | null;

  total_images: number;
  upload_number: number;

  dataset_folder: string;
  status: DatasetStatus;

  upload_time: string;

  num_classes: number;
  class_names: string[];
};

export type DatasetHistoryStats = {
  total: number;
  approved: number;
  rejected: number;
  cancelled: number;
  pending: number;
};
