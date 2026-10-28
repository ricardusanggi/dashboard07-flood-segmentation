//path: frontend/src/pages/public/Home.tsx

// Halaman Home untuk menampilkan informasi publik sistem
// Informasi diambil dari training_artifact.json model deteksi banjir aktif

import { useEffect, useState } from "react";
import publicApi from "../../api/publicApi";
import HomeView from "./HomeView";

export default function Home() {
  const [metrics, setMetrics] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {

        // Mengambil seluruh informasi model analisis dari backend
        const res = await publicApi.get("/public/model-info");

        if (!isMounted) return;

        const artifact = res.data || {};

        setMetrics(artifact.metrics || {});
        setDatasetInfo({
          dataset: artifact.dataset || {},
          training: artifact.training || {},
          trained_at: artifact.trained_at
        });

        setClasses(artifact.dataset?.class_names || []);

        setLoading(false);

      } catch (err) {
        console.error("Failed loading public model info:", err);
        setLoading(false);
      }
    }

    loadData();

    // refresh informasi model setiap 5 menit
    const interval = setInterval(loadData, 300000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };

  }, []);

  return (
    <HomeView
      metrics={metrics}
      datasetInfo={datasetInfo}
      classes={classes}
      loading={loading}
    />
  );
}
