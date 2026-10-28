//frontend/src/pages/public/HomeComponents/MetricCard.tsx
import React from "react";

export default function MetricCard({ label, value }: any) {

  return (

    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border shadow text-center">

      <div className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-300">
        {value.toFixed(1)}%
      </div>

      <div className="text-xs md:text-sm text-gray-500 mt-1">
        {label}
      </div>

    </div>

  );
}
