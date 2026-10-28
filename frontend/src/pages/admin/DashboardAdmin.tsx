// path: frontend/src/pages/admin/DashboardAdmin.tsx

import { useEffect, useState } from "react";
import api from "../../api/api";
import DashboardAdminView from "./DashboardAdminView";
import { useAuth } from "../../store/useAuth";

export default function DashboardAdmin() {

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [pendingDatasets, setPendingDatasets] = useState(0);
  const [activeModelVersion, setActiveModelVersion] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalModels, setTotalModels] = useState(0);
  const [totalTrainings, setTotalTrainings] = useState(0);

  /* ========================================================= */
  /*                  DATASET STATISTICS (TELUR IKAN)          */
  /* ========================================================= */

  const [datasetStats, setDatasetStats] = useState({
    total_images: 0,
    num_classes: 0,
    per_class: {} as Record<string, number>
  });


  /* ========================================================= */
  /*                     INITIAL LOAD                          */
  /* ========================================================= */

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    loadData();

  }, []);


  /* ========================================================= */
  /*                   LOAD DASHBOARD DATA                     */
  /* ========================================================= */

  async function loadData() {

    try {

      setLoading(true);

      /*
        Semua API dijalankan secara paralel
        untuk mempercepat loading dashboard admin
      */

      const [
        pending,
        model,
        users,
        models,
        jobs,
        stats
      ] = await Promise.all([

        api.get("/admin/datasets/pending"),

        api.get("/admin/models/active"),

        api.get("/admin/users"),

        api.get("/admin/models/lists"),

        api.get("/admin/training/jobs"),

        api.get("/admin/datasets/stats")

      ]);


      /* ================= DATASET MENUNGGU REVIEW ================= */

      setPendingDatasets(pending.data?.length ?? 0);


      /* ================= MODEL AKTIF ================= */

      setActiveModelVersion(
        model.data?.version ?? null
      );


      /* ================= TOTAL PENGGUNA ================= */

      setTotalUsers(users.data?.length ?? 0);


      /* ================= TOTAL MODEL ================= */

      setTotalModels(models.data?.length ?? 0);


      /* ================= TOTAL TRAINING ================= */

      setTotalTrainings(jobs.data?.length ?? 0);


      /* ================= DATASET STATISTICS ================= */

      /*
        Statistik dataset digunakan untuk
        menganalisis distribusi citra banjir
        yang digunakan dalam pelatihan model AI
        berbasis Deep Learning.
      */

      setDatasetStats({

        total_images: stats.data?.total_images ?? 0,

        num_classes: stats.data?.num_classes ?? 0,

        per_class: stats.data?.per_class ?? {}

      });

    } catch (err) {

      console.error("Gagal memuat dashboard admin", err);

    } finally {

      setLoading(false);

    }

  }


  /* ========================================================= */
  /*                      RENDER VIEW                          */
  /* ========================================================= */

  return (

    <DashboardAdminView
      loading={loading}
      pendingDatasets={pendingDatasets}
      activeModelVersion={activeModelVersion}
      totalUsers={totalUsers}
      totalModels={totalModels}
      totalTrainings={totalTrainings}
      datasetStats={datasetStats}
    />

  );

}