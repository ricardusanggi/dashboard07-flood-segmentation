//  path : frontend/src/components/ui/TableRow.tsx
import React from "react";

export function Tr({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition ${className}`}
    >
      {children}
    </tr>
  );
}
