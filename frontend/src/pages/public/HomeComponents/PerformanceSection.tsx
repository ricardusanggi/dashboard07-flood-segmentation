//frontend/src/pages/public/HomeComponents/PerformanceSection.tsx
import React, { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer
} from "recharts";

import { ChevronDown } from "lucide-react";

import MetricCard from "./MetricCard";
import ConfigItem from "./ConfigItem";

export default function PerformanceSection({ metrics, datasetInfo, loading }: any) {

  const [openConfig, setOpenConfig] = useState(false);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 300);
    return () => clearTimeout(timer);
  }, []);

  /* ========================
     METRIC DATA
  ======================== */

  const radarData = [
    { metric: "IoU", value: (metrics?.iou ?? 0) * 100 },
    { metric: "Dice", value: (metrics?.dice ?? 0) * 100 },
    { metric: "Pixel Acc", value: (metrics?.pixel_acc ?? 0) * 100 }
  ];

  /* ========================
     TRAINING & DATASET
  ======================== */

  const training = datasetInfo?.training || {};
  const dataset = datasetInfo?.dataset || {};

  const architectureName =
    training?.architecture
      ?.replaceAll("_", "")
      .replace(/\b\w/g, c => c.toUpperCase()) ?? "-"

  if (loading || !metrics) return null;

  return (

    <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900">

      <div className="max-w-6xl mx-auto">

        {/* TITLE */}

        <div className="text-center mb-12">

          <h2 className="text-3xl md:text-4xl font-bold">
            Performa Model Segmentasi Banjir
          </h2>

          <p className="text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">

            Evaluasi performa model dilakukan menggunakan metrik segmentasi
            standar yang umum digunakan dalam penelitian visi komputer.
            Metrik IoU, Dice, dan Pixel Accuracy digunakan untuk mengukur
            kualitas segmentasi area banjir yang dihasilkan oleh sistem
            deteksi berbasis kecerdasan artificial.

          </p>

        </div>

        {/* METRIC CARD */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">

          <MetricCard label="IoU" value={(metrics?.iou ?? 0) * 100} />
          <MetricCard label="Dice" value={(metrics?.dice ?? 0) * 100} />
          <MetricCard label="Pixel Accuracy" value={(metrics?.pixel_acc ?? 0) * 100} />

        </div>

        {/* RADAR CHART */}

        {showChart && (

          <div className="max-w-lg mx-auto h-[320px]">

            <ResponsiveContainer>

              <RadarChart data={radarData}>

                <PolarGrid />

                <PolarAngleAxis dataKey="metric" />

                <Radar
                  dataKey="value"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.45}
                />

              </RadarChart>

            </ResponsiveContainer>

          </div>

        )}

        {/* CONFIGURATION */}

        <div className="max-w-3xl mx-auto mt-16">

          <button
            onClick={() => setOpenConfig(!openConfig)}
            className="w-full flex items-center justify-between py-4 border-b"
          >

            <span className="font-semibold text-lg">
              Detail Konfigurasi Model
            </span>

            <ChevronDown
              className={`transition ${openConfig ? "rotate-180" : ""}`}
            />

          </button>

          {openConfig && (

            <div className="mt-8 space-y-8">

              {/* TRAINING PARAMETER */}

              <div>

                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Parameter Pelatihan Model
                </h3>

                <div className="grid md:grid-cols-2 gap-x-16 gap-y-3 text-sm">

                  <ConfigItem label="Arsitektur Model" value={architectureName} />
                  <ConfigItem label="Epoch Pelatihan" value={training?.epochs} />

                  <ConfigItem label="Batch Size" value={training?.batch_size} />
                  <ConfigItem label="Learning Rate" value={training?.learning_rate} />

                  <ConfigItem label="Optimizer" value={training?.optimizer} />
                  <ConfigItem label="Loss Function" value={training?.loss_function} />

                  <ConfigItem label="Validation Split" value={training?.val_split} />
                  <ConfigItem label="Perangkat Komputasi" value={training?.device} />

                </div>

              </div>

              {/* DATASET INFORMATION */}

              <div>

                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Informasi Dataset Pelatihan
                </h3>

                <div className="grid md:grid-cols-2 gap-x-16 gap-y-3 text-sm">

                  <ConfigItem label="Jumlah Citra" value={dataset?.total_images} />
                  <ConfigItem label="Jumlah Mask" value={dataset?.total_masks} />

                  <ConfigItem label="Lokasi Dataset" value={dataset?.path} />
                  <ConfigItem label="Validasi Split" value={training?.val_split} />

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </section>

  );

}
