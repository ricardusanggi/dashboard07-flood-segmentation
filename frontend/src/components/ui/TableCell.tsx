//path : frontend/src/components/ui/TableCell.tsx
import React from "react";

export function Th({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`
        p-3 text-left
        text-xs uppercase tracking-wide font-semibold
        text-gray-600 dark:text-gray-300
        ${className}
      `}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`
        p-3 text-sm
        text-gray-700 dark:text-gray-200
        align-middle
        ${className}
      `}
    >
      {children}
    </td>
  );
}
