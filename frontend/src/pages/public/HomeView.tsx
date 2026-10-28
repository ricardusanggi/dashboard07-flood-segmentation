//frontend/src/pages/public/HomeView.tsx
import React from "react";
import PublicLayout from "../../components/layouts/PublicLayout";

import HeroSection from "./HomeComponents/HeroSection";
import FeatureSection from "./HomeComponents/FeatureSection";
import PerformanceSection from "./HomeComponents/PerformanceSection";

export default function HomeView({ metrics, datasetInfo, loading }: any) {

  return (
    <PublicLayout>

      <HeroSection datasetInfo={datasetInfo} />

      <FeatureSection />

      <PerformanceSection
        metrics={metrics}
        datasetInfo={datasetInfo}
        loading={loading}
      />

      <footer className="text-center py-10 text-gray-400 text-xs md:text-sm">
        © {new Date().getFullYear()} Sistem Deteksi Banjir —
        Sistem Segmentasi Citra Banjir Berbasis Kecerdasan Artificial
      </footer>

    </PublicLayout>
  );
}
