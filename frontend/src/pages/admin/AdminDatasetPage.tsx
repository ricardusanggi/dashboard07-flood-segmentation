// src/pages/admin/AdminDatasetPage.tsx

import { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import Section from "../../components/ui/Section";

import { usersDatasetApi } from "../../api/users";
import { adminDatasetApi } from "../../api/adminDataset";

import type {
  DatasetStatus,
  UserEntry,
  Pending,
  PreviewItem,
  TrainStats,
  MergeSummaryItem,
  DatasetHistoryStats
} from "./types/datasetTypes";

import AdminDatasetPageViewTabs from "./AdminDatasetPageViewTabs";
import AdminDatasetPageViewUpload from "./AdminDatasetPageViewUpload";
import AdminDatasetPageViewHistory from "./AdminDatasetPageViewHistory";
import AdminDatasetPageViewPending from "./AdminDatasetPageViewPending";
import AdminDatasetPageViewMerge from "./AdminDatasetPageViewMerge";
import AdminDatasetPageViewModals from "./AdminDatasetPageViewModals";

export default function AdminDatasetPage() {
  const [tab, setTab] = useState<"history" | "upload" | "pending" | "merge">("history");

  /* ================= UPLOAD ================= */

  const [hasPending, setHasPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /* ================= HISTORY ================= */

  const [history, setHistory] = useState<UserEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<UserEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState<DatasetHistoryStats>({
    total: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pending: 0
  });

  /* ================= TRAIN STATS ================= */
  /*
    Statistik dataset digunakan untuk memonitor
    distribusi citra banjir pada dataset pelatihan.

    Informasi ini penting untuk:
    - mendeteksi ketidakseimbangan dataset
    - memastikan setiap kelas banjir memiliki
      jumlah sampel yang memadai
    - menjaga kualitas dataset pelatihan AI
  */
  const [trainStats, setTrainStats] = useState<TrainStats>({
    total_images: 0,
    num_classes: 0,
    class_names: [],
    per_class: {},
    is_synced: false,
    folder_total: 0,
    database_total: 0,
    dataset_health: {
      imbalance_warning: false,
      imbalance_ratio: 1,
      missing_classes: []
    }
  });

  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showTrainPreview, setShowTrainPreview] = useState(false);

  /* ================= PENDING ================= */

  const [pending, setPending] = useState<Pending[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  /* ================= MERGE ================= */

  const [mergeSummary, setMergeSummary] = useState<MergeSummaryItem[]>([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [testTrueCount, setTestTrueCount] = useState(0);
  const [testTrueLabelCount, setTestTrueLabelCount] = useState(0);

  /* ================= MODALS ================= */

  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showTrainModal, setShowTrainModal] = useState(false);

  /* =========================================================
     DATA LOADERS
  ========================================================= */

  const checkMyPending = useCallback(async () => {
    try {
      const res = await usersDatasetApi.listMyPending();
      setHasPending(Array.isArray(res.data) && res.data.length > 0);
    } catch {
      setHasPending(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);

      const res = await adminDatasetApi.listAllHistory();
      const rows: any[] = res.data || [];

      const parsed: UserEntry[] = rows.map((d) => ({
        id: d.id,
        status: d.status as DatasetStatus,
        dataset_folder: d.dataset_folder ?? "",
        total_images: d.total_images ?? 0,
        upload_number: d.upload_number ?? 0,
        upload_time: d.upload_time,
        uploader_name: d.uploader_name ?? `User ${d.user_id}`,
        reviewer_name: d.reviewer_name ?? "-",
        num_classes: d.num_classes ?? 0,
        class_names: d.class_names ?? []
      }));

      setHistory(parsed);
      setFilteredHistory(parsed);

      setStats({
        total: parsed.length,
        approved: parsed.filter((x) => x.status === "approved").length,
        rejected: parsed.filter((x) => x.status === "rejected").length,
        cancelled: parsed.filter((x) => x.status === "cancelled").length,
        pending: parsed.filter((x) => x.status === "pending").length
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      setPendingLoading(true);
      const res = await adminDatasetApi.listPending();
      setPending(res.data || []);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadTrainStats = useCallback(async () => {
    try {
      const res = await adminDatasetApi.getTrainStats();

      setTrainStats({
        total_images: res.data?.total_images ?? 0,
        num_classes: res.data?.num_classes ?? 0,
        class_names: res.data?.class_names ?? [],
        per_class: res.data?.per_class ?? {},
        is_synced: res.data?.is_synced ?? false,
        folder_total: res.data?.folder_total ?? 0,
        database_total: res.data?.database_total ?? 0,
        dataset_health: res.data?.dataset_health ?? {
          imbalance_warning: false,
          imbalance_ratio: 1,
          missing_classes: []
        }
      });
    } catch {}
  }, []);

  const refreshAllDatasetData = useCallback(async () => {
    await Promise.all([
      loadPending(),
      loadHistory(),
      loadTrainStats(),
      checkMyPending()
    ]);
  }, [loadPending, loadHistory, loadTrainStats, checkMyPending]);

  /* =========================================================
     ACTIONS (PERBAIKAN YANG DITAMBAHKAN)
  ========================================================= */

  async function handleUpload() {
    if (!selectedFile) return;

    try {
      setUploading(true);

      await usersDatasetApi.upload(selectedFile, (percent: number) =>
        setProgress(percent)
      );

      toast.success("Dataset berhasil diunggah.");
      setSelectedFile(null);
      await loadHistory();
      await loadPending();
      setTab("pending");

    } catch (error: any) {

      const detail = error?.response?.data?.detail;
      const status = error?.response?.status;

      if (status === 409) {
        toast.error(detail || "Masih ada dataset yang menunggu persetujuan.");
      } else if (status === 403) {
        toast.error("Akun tidak memiliki izin untuk mengunggah dataset.");
      } else if (status === 423) {
        toast.error("Sistem sedang training. Upload tidak dapat dilakukan.");
      } else {
        toast.error(detail || "Upload gagal. Pastikan struktur ZIP sudah benar (images/ + masks/).");
      }

    } finally {
      setUploading(false);
    }
  }

  async function handleAction(
    action: "approve" | "reject" | "cancel",
    id: number
  ) {
    try {
      setProcessingId(id);

      if (action === "approve") await adminDatasetApi.approve(id);
      if (action === "reject") await adminDatasetApi.reject(id);
      if (action === "cancel") await adminDatasetApi.cancel(id);

      await refreshAllDatasetData();
    } finally {
      setProcessingId(null);
    }
  }

  async function loadMergeSummary() {
    try {
      setMergeLoading(true);

      const res = await adminDatasetApi.getTestTrueSummary();

      setMergeSummary(res.data?.details ?? []);
      setTestTrueCount(res.data?.total ?? 0);
      setTestTrueLabelCount(res.data?.details?.length ?? 0);
    } catch {
      setMergeSummary([]);
      setTestTrueCount(0);
      setTestTrueLabelCount(0);
    } finally {
      setMergeLoading(false);
    }
  }

  function handleSearch(text: string) {
    setSearch(text);

    if (!text) {
      setFilteredHistory(history);
      return;
    }

    const q = text.toLowerCase();

    setFilteredHistory(
      history.filter((h) =>
        `${h.status} ${h.dataset_folder} ${h.uploader_name}`
          .toLowerCase()
          .includes(q)
      )
    );
  }

  async function handleToggleTrainPreview() {
    /*
      Preview dataset train digunakan untuk
      memverifikasi kualitas citra banjir
      sebelum proses pelatihan model AI dilakukan.
    */
    if (showTrainPreview) {
      setShowTrainPreview(false);
      return;
    }

    setPreviewLoading(true);

    try {
      const res = await adminDatasetApi.previewTrain();
      setPreviewItems(res.data?.preview || []);
      setShowTrainPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handlePreviewPending(id: number) {
    const res = await adminDatasetApi.preview(id);
    return res.data?.preview || [];
  }

  async function mergeDataset() {
  /*
    Menggabungkan dataset test yang telah disetujui
    ke dalam dataset train utama yang digunakan
    untuk pelatihan model segmentasi banjir.
  */
    if (!confirm("Gabungkan dataset test ke train?")) return;

    await adminDatasetApi.mergeTestTrue();

    await loadMergeSummary();
    await loadHistory();
    await loadTrainStats();

  }
  /* =========================================================
     EFFECTS
  ========================================================= */

  useEffect(() => {
    refreshAllDatasetData();
  }, [refreshAllDatasetData]);

  useEffect(() => {
    const interval = setInterval(loadTrainStats, 5000);
    return () => clearInterval(interval);
  }, [loadTrainStats]);

  useEffect(() => {
    if (tab === "pending") {
      loadPending();
      loadHistory();
    }

    if (tab === "history") {
      loadHistory();
      loadTrainStats();
    }

    if (tab === "merge") {
      loadMergeSummary();
    }
  }, [tab]);

  /* =========================================================
     RENDER
  ========================================================= */

  /* =========================================================
   RENDER
========================================================= */

  return (
    <>
      <Toaster position="top-right" />
      <Section title="🌊 Manajemen Dataset Pelatihan Segmentasi Banjir">
        <p className="text-sm text-gray-500 mb-6 max-w-3xl">

          Halaman ini digunakan untuk mengelola dataset citra banjir
          yang digunakan dalam proses pelatihan model kecerdasan buatan.
          Dataset yang diunggah oleh kontributor akan melalui proses
          <b> validasi administrator </b>
          sebelum dimasukkan ke dalam dataset pelatihan model segmentasi
          citra banjir berbasis
          <b> Deep Learning</b>.

        </p>

        <AdminDatasetPageViewTabs
          tab={tab}
          setTab={setTab}
          search={search}
          onSearch={handleSearch}
        />

        {/* ================= HISTORY ================= */}
        {tab === "history" && (
          <AdminDatasetPageViewHistory
            history={filteredHistory}
            loading={historyLoading}
            trainStats={trainStats}
            previewItems={previewItems}
            previewLoading={previewLoading}
            showTrainPreview={showTrainPreview}

            onToggleTrainPreview={handleToggleTrainPreview}

            setSelectedClasses={setSelectedClasses}
            setShowClassModal={setShowClassModal}
            setShowTrainModal={setShowTrainModal}
          />
        )}

        {/* ================= UPLOAD ================= */}
        {tab === "upload" && (
          <AdminDatasetPageViewUpload
            hasPending={hasPending}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            uploading={uploading}
            progress={progress}
            onUpload={handleUpload}
          />
        )}

        {/* ================= PENDING ================= */}
        {tab === "pending" && (
          <AdminDatasetPageViewPending
            pending={pending}
            loading={pendingLoading}
            processingId={processingId}
            onAction={handleAction}
            onPreview={handlePreviewPending}
          />
        )}

        {/* ================= MERGE ================= */}
        {tab === "merge" && (
          <AdminDatasetPageViewMerge
            summary={mergeSummary}
            totalImages={testTrueCount}
            totalLabels={testTrueLabelCount}
            loading={mergeLoading}

            loadMergeSummary={loadMergeSummary}
            loadHistory={loadHistory}
            loadTrainStats={loadTrainStats}

            mergeDataset={mergeDataset}
          />
        )}

      </Section>

      {/* ================= MODALS ================= */}

      <AdminDatasetPageViewModals
        showClassModal={showClassModal}
        selectedClasses={selectedClasses}
        onCloseClass={() => setShowClassModal(false)}
        showTrainModal={showTrainModal}
        trainClassNames={trainStats.class_names ?? []}
        onCloseTrain={() => setShowTrainModal(false)}
      />
    </>
  );
}