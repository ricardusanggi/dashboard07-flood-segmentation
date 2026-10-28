//frontend/src/pages/public/HomeComponents/FeatureSection.tsx
import React from "react";
import { Cpu, BarChart3, GitBranch } from "lucide-react";
import FeatureCard from "./FeatureCard";

export default function FeatureSection() {

  return (

    <section className="py-24 px-6">

      <div className="max-w-6xl mx-auto text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Keunggulan Sistem
        </h2>

        <p className="text-gray-500 max-w-2xl mx-auto mb-16 leading-relaxed">

          Sistem Segmentasi Citra Banjir dirancang untuk mendukung proses
          deteksi dan segmentasi area terdampak banjir melalui analisis citra
          digital secara sistematis dengan memanfaatkan teknologi kecerdasan
          artificial serta pengelolaan dataset pelatihan yang terstruktur.
          Platform ini memungkinkan proses segmentasi citra dilakukan secara
          otomatis sekaligus mendukung pengembangan penelitian dalam bidang
          mitigasi bencana dan pengolahan citra.

        </p>

        <div className="grid md:grid-cols-3 gap-10">

          <FeatureCard
            icon={<Cpu />}
            title="Model Deep Learning Modern"
            description="Model segmentasi menggunakan arsitektur U-Net dan DeepLabV3+ yang dirancang untuk menghasilkan mask biner pada citra banjir. Pendekatan deep learning ini memungkinkan segmentasi area terdampak banjir secara presisi piksel per piksel."
          />

          <FeatureCard
            icon={<BarChart3 />}
            title="Evaluasi Performa Model"
            description="Performa model dievaluasi menggunakan metrik segmentasi seperti IoU (Intersection over Union), Dice Score, dan Pixel Accuracy. Evaluasi ini memberikan gambaran menyeluruh mengenai kemampuan model dalam mensegmentasi area banjir dari citra digital."
          />

          <FeatureCard
            icon={<GitBranch />}
            title="Pengembangan Dataset Berkelanjutan"
            description="Sistem mendukung kontribusi dataset oleh pengguna terdaftar sehingga proses pelatihan model dapat dilakukan secara berkelanjutan. Pendekatan ini memungkinkan peningkatan kualitas model melalui penambahan data pelatihan citra banjir yang lebih beragam."
          />

        </div>

      </div>

    </section>

  );

}
