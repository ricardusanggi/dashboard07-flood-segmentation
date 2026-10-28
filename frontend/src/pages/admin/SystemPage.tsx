// path: frontend/src/pages/admin/system/SystemPage.tsx

import { useState } from "react";
import Section from "../../components/ui/Section";

import SystemResetComponent from "./SystemPageResetComponent";

export default function SystemPage() {

  const [tab, setTab] = useState<"reset" | "docker">("reset");

  return (

    <Section title="⚙ System Maintenance">

      {/* TAB NAVIGATION */}

      <div className="flex gap-3 mb-6 border-b pb-3 dark:border-gray-700">

        <button
          onClick={() => setTab("reset")}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            tab === "reset"
              ? "bg-red-600 text-white"
              : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          System Reset
        </button>

      </div>

      {/* CONTENT */}

      {tab === "reset" && <SystemResetComponent />}

    </Section>

  );
}