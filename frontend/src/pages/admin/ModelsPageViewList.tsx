import Card from "../../components/ui/Card"
import Spinner from "../../components/Spinner"
import type { ModelItem } from "./types/modelTypes"

type Props = {
  paginatedData: ModelItem[]
  stats: {
    total: number
    approved: number
    pending: number
    rejected: number
  }

  loading: boolean

  currentPage: number
  totalPages: number
  setCurrentPage: (p: number) => void

  handleSetActive: (m: ModelItem) => void
}

export default function ModelsPageViewList({
  paginatedData,
  stats,
  loading,
  currentPage,
  totalPages,
  setCurrentPage,
  handleSetActive
}: Props) {

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Card className="p-10 flex justify-center">
        <Spinner />
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* ================= STATISTIK MODEL ================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Stat label="Total Model" value={stats.total} color="blue" />
        <Stat label="Model Disetujui" value={stats.approved} color="green" />
        <Stat label="Menunggu Review" value={stats.pending} color="yellow" />
        <Stat label="Ditolak" value={stats.rejected} color="red" />

      </div>


      {/* ================= DAFTAR MODEL ================= */}

      <Card className="p-5 border dark:border-gray-800 dark:bg-gray-900">

        {paginatedData.length === 0 ? (

          <div className="text-center py-10 text-gray-500">
            Belum tersedia model AI yang dapat ditampilkan.
          </div>

        ) : (

          <div className="space-y-3">

            {paginatedData.map((m) => {

              const hasPerformance =
                m.accuracy !== null ||
                m.precision !== null ||
                m.recall !== null

              return (

                <div
                  key={m.id}
                  className="
                    px-4 py-3
                    border
                    rounded-lg
                    hover:bg-gray-50
                    dark:hover:bg-gray-800
                    dark:border-gray-700
                    transition
                  "
                >

                  <div className="flex justify-between items-start">

                    {/* ================= INFO MODEL ================= */}

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {m.name}
                        </div>

                        {m.is_active && (
                          <span className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded">
                            ACTIVE
                          </span>
                        )}

                      </div>

                      <div className="text-xs text-gray-500 flex flex-wrap gap-3">

                        <span>
                          Versi
                          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                            {m.version}
                          </span>
                        </span>

                        {m.architecture && (
                          <span>
                            Arsitektur
                            <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                              {formatArchitecture(m.architecture)}
                            </span>
                          </span>
                        )}

                      </div>

                    </div>


                    {/* ================= ACTION ================= */}

                    {!m.is_active && (
                      <button
                        onClick={() => handleSetActive(m)}
                        className="
                          bg-green-600
                          hover:bg-green-700
                          text-white
                          text-xs
                          px-3
                          py-1.5
                          rounded-md
                          transition
                        "
                      >
                        Set Active
                      </button>
                    )}

                  </div>


                  {/* ================= PERFORMA MODEL ================= */}

                  {hasPerformance && (

                    <div className="grid grid-cols-3 gap-2 mt-3">

                      <PerfItem label="IoU" value={m.accuracy ?? undefined} />
                      <PerfItem label="Dice" value={m.precision ?? undefined} />
                      <PerfItem label="Pixel Acc" value={m.recall ?? undefined} />

                    </div>

                  )}

                </div>

              )
            })}

          </div>

        )}


        {/* ================= PAGINASI ================= */}

        {totalPages > 1 && (

          <div className="flex justify-center gap-2 mt-6">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => (

              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-green-600 text-white"
                    : "border"
                }`}
              >
                {i + 1}
              </button>

            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              →
            </button>

          </div>

        )}

      </Card>

    </div>
  )
}


/* ================= STAT CARD ================= */

function Stat({
  label,
  value,
  color
}: {
  label: string
  value: number
  color: "blue" | "green" | "yellow" | "red"
}) {

  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700"
  }

  return (
    <div className={`p-4 rounded-xl border text-center ${colors[color]}`}>
      <div className="text-xs">{label}</div>
      <div className="text-xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  )
}


/* ================= PERFORMANCE ITEM ================= */

function PerfItem({
  label,
  value
}: {
  label: string
  value?: number
}) {

  if (value === undefined) return null

  return (
    <div className="text-center p-2 rounded-md bg-gray-50 dark:bg-gray-800">

      <div className="text-[10px] text-gray-500">
        {label}
      </div>

      <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 tabular-nums">
        {(value * 100).toFixed(1)}%
      </div>

    </div>
  )
}


/* ================= FORMAT ARSITEKTUR ================= */

function formatArchitecture(arch?: string) {

  if (!arch) return "-"

  return arch
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, c => c.toUpperCase())

}