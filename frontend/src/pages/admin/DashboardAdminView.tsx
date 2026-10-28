import { Link } from "react-router-dom"
import Section from "../../components/ui/Section"
import Card from "../../components/ui/Card"

import {
  Database,
  Layers,
  Users,
  Box,
  PlayCircle,
  Trash2,
  Droplets
} from "lucide-react"

interface Props {
  pendingDatasets: number
  activeModelVersion: number | null
  totalUsers: number
  totalModels: number
  totalTrainings: number

  datasetStats: {
    total_images: number
    num_classes: number
    per_class: Record<string, number>
  }
}

export default function DashboardAdminView({
  pendingDatasets,
  activeModelVersion,
  totalUsers,
  totalModels,
  totalTrainings,
  datasetStats
}: Props) {

  const classes = Object.entries(datasetStats.per_class ?? {})

  return (

    <Section title="🌊 Dashboard Admin Sistem Deteksi Banjir">

      {/* ================= DESKRIPSI SISTEM ================= */}

      <Card className="mb-8 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

        <div className="flex items-center gap-4">

          <Droplets className="text-blue-500" size={28}/>

          <div>

            <h3 className="font-semibold text-lg">
              Sistem Segmentasi Citra Banjir
            </h3>

            <p className="text-sm text-gray-500 mt-1">

              Dashboard ini digunakan untuk mengelola dataset citra banjir,
              menjalankan proses pelatihan model kecerdasan buatan,
              serta memonitor performa sistem segmentasi berbasis
              <b> Deep Learning </b>
              untuk mendeteksi area terdampak banjir secara otomatis.

            </p>

          </div>

        </div>

      </Card>


      {/* ================= KPI UTAMA ================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* DATASET */}

        <Card className="md:col-span-2 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm opacity-80">
                Dataset Pelatihan Banjir
              </p>

              <h2 className="text-4xl font-bold mt-2">
                {datasetStats.total_images.toLocaleString()} Citra
              </h2>

              <p className="text-sm opacity-80 mt-2">
                {datasetStats.total_images} citra • {datasetStats.num_classes} kelas
              </p>

              <p className="text-xs opacity-80 mt-2">
                Dataset digunakan untuk penelitian segmentasi citra banjir.
              </p>

            </div>

            <Trash2 size={42} className="opacity-80" />

          </div>

        </Card>


        {/* DATASET REVIEW */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/40">
              <Database size={24} className="text-green-600 dark:text-green-300" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Dataset Menunggu Review
              </p>

              <p className="text-2xl font-semibold">
                {pendingDatasets}
              </p>

            </div>

          </div>

        </Card>


        {/* MODEL AKTIF */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/40">
              <Layers size={24} className="text-green-600 dark:text-green-300" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Model Aktif
              </p>

              <p className="text-lg font-semibold">

                {activeModelVersion !== null
                  ? `Versi ${activeModelVersion}`
                  : "Belum Ada"}

              </p>

            </div>

          </div>

        </Card>

      </div>


      {/* ================= DISTRIBUSI DATASET ================= */}

      {classes.length > 0 && (

        <div className="mt-10">

          <h3 className="text-lg font-semibold mb-4">
            Distribusi Dataset Banjir
          </h3>

          <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {classes.map(([label, count]) => (

                <div
                  key={label}
                  className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-center"
                >

                  <p className="text-sm text-gray-500">
                    {label}
                  </p>

                  <p className="text-lg font-semibold">
                    {count}
                  </p>

                </div>

              ))}

            </div>

          </Card>

        </div>

      )}


      {/* ================= METRIC SECONDARY ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

        {/* USERS */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <Users size={24} className="text-purple-500" />

            <div>
              <p className="text-sm text-gray-500">
                Total Pengguna
              </p>

              <p className="text-2xl font-semibold">
                {totalUsers}
              </p>
            </div>

          </div>

        </Card>


        {/* MODELS */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <Box size={24} className="text-green-500" />

            <div>

              <p className="text-sm text-gray-500">
                Total Model
              </p>

              <p className="text-2xl font-semibold">
                {totalModels}
              </p>

            </div>

          </div>

        </Card>


        {/* TRAINING */}

        <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition">

          <div className="flex items-center gap-4">

            <PlayCircle size={24} className="text-red-500" />

            <div>

              <p className="text-sm text-gray-500">
                Riwayat Training
              </p>

              <p className="text-2xl font-semibold">
                {totalTrainings}
              </p>

            </div>

          </div>

        </Card>

      </div>


      {/* ================= QUICK ACTION ================= */}

      <div className="mt-12">

        <h3 className="text-lg font-semibold mb-6">
          Aksi Cepat
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <Link to="/admin/datasets">
            <Card className="group p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">
                    Kelola Dataset
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Review & validasi dataset citra banjir
                  </p>
                </div>
                <Database className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </Card>
          </Link>

          <Link to="/admin/training">
            <Card className="group p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">
                    Training Model
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Jalankan & pantau pelatihan model AI
                  </p>
                </div>
                <Layers className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </Card>
          </Link>

          <Link to="/admin/models">
            <Card className="group p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">
                    Kelola Model
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktivasi & monitoring model segmentasi banjir
                  </p>
                </div>
                <Box className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </Card>
          </Link>

          <Link to="/admin/users">
            <Card className="group p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">
                    Kelola Pengguna
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Manajemen & verifikasi kontributor dataset
                  </p>
                </div>
                <Users className="opacity-40 group-hover:opacity-100 transition" />
              </div>
            </Card>
          </Link>

        </div>

      </div>

    </Section>

  )

}