import { Activity, UploadCloud, List, RotateCcw, Search } from "lucide-react";

/* =========================================================
   TAB TYPE
========================================================= */

export type TabKey = "active" | "upload" | "list" | "version";

type Props = {
  tab: TabKey;
  setTab: (v: TabKey) => void;
  search: string;
  onSearch: (v: string) => void;
};

/* =========================================================
   TAB CONFIG
========================================================= */

const tabs: {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "active", label: "Model Aktif", icon: Activity },
  { key: "upload", label: "Upload Model", icon: UploadCloud },
  { key: "list", label: "Daftar Model", icon: List },
  { key: "version", label: "Kontrol Versi", icon: RotateCcw }
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ModelsPageViewTabs({
  tab,
  setTab,
  search,
  onSearch
}: Props) {

  return (

    <div className="flex gap-3 mb-6 border-b pb-3 dark:border-gray-700">

      {/* ================= TAB BUTTONS ================= */}

      {tabs.map((t) => {

        const Icon = t.icon;

        return (

          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`
              px-4 py-2 rounded-full font-semibold transition
              ${
                tab === t.key
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >

            <div className="flex items-center gap-2">

              <Icon size={16} />

              {t.label}

            </div>

          </button>

        );

      })}


      {/* ================= SEARCH ================= */}

      {tab === "list" && (

        <div className="ml-auto flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">

          <Search size={16} className="text-gray-400" />

          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari model AI..."
            className="bg-transparent outline-none dark:text-gray-200"
          />

        </div>

      )}

    </div>

  );

}