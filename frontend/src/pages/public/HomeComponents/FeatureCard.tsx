//frontend/src/pages/public/HomeComponents/FeatureCard.tsx
import React from "react";

export default function FeatureCard({ icon, title, description }: any) {

  return (

    <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 shadow border transition hover:shadow-md">

      <div className="text-yellow-500 mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {description}
      </p>

    </div>

  );

}
