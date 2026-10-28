// path: frontend/src/pages/user/DashboardUserViewHistory.tsx

import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";

type PredictionLog = {
  id: number;
  label: string;
  predicted_at: string;
  model_version: number | null;
  input_path?: string | null;
};

type Props = {
  predictionHistory?: PredictionLog[];
};

const METHOD_LABELS: Record<string, string> = {
  unet:     "U-Net",
  deeplab:  "DeepLab",
  otsu:     "Otsu",
  canny:    "Canny",
  watershed:"Watershed",
};

function MethodBadge({ method }: { method: string }) {
  const isDeep = method === "unet" || method === "deeplab";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isDeep
          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
      }`}
    >
      {METHOD_LABELS[method.toLowerCase()] ?? method}
    </span>
  );
}

export default function DashboardUserViewHistory({
  predictionHistory = []
}: Props) {

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return date;
    }
  }

  function getImageUrl(path?: string | null) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const base = import.meta.env.VITE_API_URL ?? "";
    return `${base}/${path}`;
  }

  return (
    <Section title="🌊 Riwayat Deteksi Banjir">
      <Card className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

        {/* ================= EMPTY ================= */}

        {predictionHistory.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🌊</div>
            <p className="text-gray-500">Belum tersedia riwayat analisis.</p>
            <p className="text-xs text-gray-400 mt-1">
              Hasil segmentasi area banjir akan ditampilkan pada bagian ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* ================= HEADER ================= */}

              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0">
                <tr>
                  <th className="p-3 text-left">Waktu</th>
                  <th className="p-3 text-left">Metode Segmentasi</th>
                  <th className="p-3 text-left">Versi Model</th>
                  <th className="p-3 text-left">Citra Input</th>
                </tr>
              </thead>

              {/* ================= BODY ================= */}

              <tbody>
                {predictionHistory.map((p) => {
                  const imageUrl = getImageUrl(p.input_path);
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >

                      {/* TIME */}
                      <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(p.predicted_at)}
                      </td>

                      {/* METHOD */}
                      <td className="p-3">
                        <MethodBadge method={p.label} />
                      </td>

                      {/* MODEL VERSION */}
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {p.model_version ? `v${p.model_version}` : (
                          <span className="text-xs text-gray-400">Klasikal</span>
                        )}
                      </td>

                      {/* IMAGE */}
                      <td className="p-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="citra input banjir"
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </Card>
    </Section>
  );
}
