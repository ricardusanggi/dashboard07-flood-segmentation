//frontend/src/pages/public/HomeComponents/HeroSection.tsx
import React, { useEffect, useState, lazy, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { Droplets, UploadCloud } from "lucide-react";

const NeuralBackground = lazy(() =>
  import("../../../components/ai/NeuralBackground")
);

export default function HeroSection({ datasetInfo }: any) {

  const [lowPerformance, setLowPerformance] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    const mediaQuery = window.matchMedia("(max-width:1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches || reducedMotion.matches) {
      setLowPerformance(true);
    }

  }, []);

  useEffect(() => {

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );

    if (heroRef.current) observer.observe(heroRef.current);

    return () => observer.disconnect();

  }, []);

  const architecture =
    datasetInfo?.training?.architecture
      ?.replaceAll("_", " ")
      .replace(/\b\w/g, c => c.toUpperCase()) ?? "-";

  return (

    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-6 text-white overflow-hidden bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-700"
    >

      {!lowPerformance && heroVisible && (
        <Suspense fallback={null}>
          <div className="absolute inset-0 z-0">
            <NeuralBackground />
          </div>
        </Suspense>
      )}

      <div className="hero-glow" />

      <div className="relative z-10 max-w-6xl mx-auto text-center">

        <Droplets className="w-16 h-16 mx-auto mb-6 text-cyan-300" />

        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">

          Deteksi Banjir

          <br />

          <span className="text-cyan-300">
            Sistem Segmentasi Citra Banjir
          </span>

        </h1>

        <p className="mt-6 text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">

          <span className="text-cyan-300 font-semibold">
            Sistem Deteksi Banjir
          </span>{" "}
          merupakan sistem analisis citra digital yang dirancang untuk membantu
          proses identifikasi area terdampak banjir secara otomatis.
          Sistem ini memanfaatkan teknologi
          <span className="text-cyan-300 font-semibold">
            {" "}Deep Learning
          </span>{" "}
          dengan arsitektur
          <span className="text-cyan-300 font-semibold">
            {" "}{architecture}
          </span>{" "}
          untuk mengekstraksi karakteristik visual dari citra banjir
          dan menghasilkan mask segmentasi area terdampak banjir secara sistematis.

        </p>

        {/* PENJELASAN FITUR UTAMA */}

        <div className="grid md:grid-cols-2 gap-8 mt-10 text-left">

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">

            <h3 className="font-semibold text-cyan-300 mb-2">
              Mulai Deteksi
            </h3>

            <p className="text-sm text-white/80 leading-relaxed">

              Pengguna dapat mengunggah citra untuk dianalisis
              oleh model segmentasi berbasis kecerdasan artificial. Sistem
              akan menghasilkan mask segmentasi area banjir beserta
              metrik evaluasi seperti IoU, Dice Score, dan Pixel Accuracy
              apabila mask ground-truth turut diunggah.

            </p>

          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">

            <h3 className="font-semibold text-cyan-300 mb-2">
              Kontribusi Dataset
            </h3>

            <p className="text-sm text-white/80 leading-relaxed">

              Pengguna terdaftar dapat berkontribusi dalam pengembangan dataset
              dengan menambahkan citra banjir yang telah diberi label.
              Dataset yang telah diverifikasi akan digunakan dalam proses
              pelatihan ulang model guna meningkatkan akurasi serta kemampuan
              generalisasi sistem dalam mengenali variasi area terdampak banjir.

            </p>

          </div>

        </div>

        {/* CTA */}

        <div className="flex flex-col md:flex-row justify-center gap-6 mt-10">

          <Link
            to="/predict"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg transition"
          >

            <Droplets size={20} />
            Mulai Deteksi

          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
          >

            <UploadCloud size={20} />
            Kontribusi Dataset

          </Link>

        </div>

      </div>

    </section>

  );

}
