//path: frontend/src/pages/admin/TrainingPage.tsx

import { useEffect, useRef, useState } from "react";
import {
  getTrainingStatus,
  listTrainingJobs,
  startTrainingJob,
  approveTraining,
  rejectTraining,
  previewTrainingJob
} from "../../api/adminTraining";

import TrainingPageView from "./TrainingPageView";

import type {
  TrainingJob,
  TrainingStatusResponse,
  PreviewData,
  TrainingParams
} from "./types/trainingTypes";

import { Toaster, toast } from "react-hot-toast";

/* =========================================================
   CHECK METRICS READY
   memastikan training selesai sebelum approval
========================================================= */

function isMetricsReady(job: TrainingJob) {

  return (
    job.best_train_loss !== null &&
    job.best_val_loss !== null &&
    job.iou !== null &&
    job.dice !== null
  );

}

export default function TrainingPage() {

  const [starting, setStarting] = useState(false);

  const [status, setStatus] =
    useState<TrainingStatusResponse | null>(null);

  const [jobs, setJobs] =
    useState<TrainingJob[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [previewJob, setPreviewJob] =
    useState<TrainingJob | null>(null);

  const [loadingPreview, setLoadingPreview] =
    useState(false);

  const [previewData, setPreviewData] =
    useState<PreviewData | null>(null);

  const pollRef = useRef<number | null>(null);

  const pollingRef = useRef(false);


  /* =========================================================
     TRAINING PARAMETERS
     default parameter training model AI
  ========================================================= */

  const [params, setParams] = useState<TrainingParams>({
    architecture: "unet_resnet34",
    epochs: 50,
    batch_size: 4,
    learning_rate: 0.0001,
    optimizer: "adam",
    loss_function: "bce_dice",
    augmentation: true,
    val_split: 0.2,
    use_pso: false,
    pso_population: 5,
    pso_iters: 10
  });


  /* =========================================================
     LOAD TRAINING STATUS
  ========================================================= */

  async function loadStatus() {

    try {

      const res = await getTrainingStatus();

      setStatus(res);

      return Boolean(res?.running);

    } catch (err) {

      console.error("Failed loading status", err);

      return false;

    }

  }


  /* =========================================================
     LOAD TRAINING JOBS
  ========================================================= */

  async function loadJobs() {

    try {

      const res = await listTrainingJobs();

      setJobs(Array.isArray(res) ? res : []);

    } catch (err) {

      console.error("Failed loading training jobs", err);

      setJobs([]);

    }

  }


  /* =========================================================
     STOP POLLING
  ========================================================= */

  function stopPolling() {

    if (pollRef.current === null) return;

    clearInterval(pollRef.current);

    pollRef.current = null;

    pollingRef.current = false;

  }


  /* =========================================================
     START POLLING
     polling status training setiap 4 detik
  ========================================================= */

  function startPolling() {

    if (pollRef.current !== null) return;

    pollRef.current = window.setInterval(async () => {

      if (pollingRef.current) return;

      pollingRef.current = true;

      try {

        const running = await loadStatus();

        await loadJobs();

        if (!running) {

          stopPolling();

        }

      } catch (err) {

        console.error("Polling error", err);

      } finally {

        pollingRef.current = false;

      }

    }, 4000);

  }


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    async function init() {

      setLoading(true);

      const running = await loadStatus();

      await loadJobs();

      if (running && pollRef.current === null) {

        startPolling();

      }

      setLoading(false);

    }

    init();

    return () => {

      stopPolling();

    };

  }, []);



  /* =========================================================
     START TRAINING
  ========================================================= */

  async function handleStart() {

    if (starting) return;

    if (status?.running) {

      toast.error("Training masih berjalan.");

      return;

    }

    if (!confirm("Mulai training model baru?")) return;

    try {

      setStarting(true);

      const res = await startTrainingJob(params);

      setStatus({
        running: true,
        job: { id: res?.job_id }
      } as TrainingStatusResponse);

      await loadJobs();

      startPolling();

      toast.success("Training berhasil dimulai");

    } catch (err: any) {

      console.error("Start training error:", err);

      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Terjadi kesalahan saat memulai training.";

      toast.error("Gagal memulai training: " + msg);

    } finally {

      setStarting(false);

    }

  }


  /* =========================================================
     APPROVE TRAINING RESULT
  ========================================================= */

  async function handleApprove(job: TrainingJob) {

    if (job.review_status !== "pending") return;

    if (!isMetricsReady(job)) {

      toast.error("Training belum selesai. Metrics belum lengkap.");

      return;

    }

    if (!confirm(`Setujui hasil training #${job.id}?`)) return;

    try {

      await approveTraining(job.id);

      await loadStatus();

      await loadJobs();

      toast("Training disetujui. Model siap digunakan.");

    } catch (err: any) {

      toast(err.response?.data?.detail || err.message);

    }

  }


  /* =========================================================
     REJECT TRAINING RESULT
  ========================================================= */

  async function handleReject(jobId: number) {

    if (!confirm(`Tolak hasil training #${jobId}?`)) return;

    try {

      await rejectTraining(jobId);

      await loadJobs();

    } catch (err: any) {

      toast(err.response?.data?.detail || err.message);

    }

  }


  /* =========================================================
     OPEN PREVIEW
     preview dataset training
  ========================================================= */

  async function openPreview(job: TrainingJob) {

    if (loadingPreview) return;

    setPreviewJob(job);

    setPreviewData(null);

    setLoadingPreview(true);

    try {

      const res = await previewTrainingJob(job.id, 30);

      setPreviewData(res);

    } catch (err) {

      console.error("Failed preview", err);

      setPreviewData(null);

    } finally {

      setLoadingPreview(false);

    }

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <>
      <Toaster position="top-right" />

      <TrainingPageView
        loading={loading}
        status={status}
        jobs={jobs}
        params={params}
        setParams={setParams}
        previewJob={previewJob}
        previewData={previewData}
        loadingPreview={loadingPreview}
        setPreviewJob={setPreviewJob}
        handleStart={handleStart}
        handleApprove={handleApprove}
        handleReject={handleReject}
        openPreview={openPreview}
        isMetricsReady={isMetricsReady}
      />
    </>

  );

}