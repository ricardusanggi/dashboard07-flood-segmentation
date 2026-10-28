//path : frontend/src/components/ui/TableHead.tsx
import React from "react";

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">{children}</thead>
  );
}
