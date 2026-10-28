//path : frontend/src/components/ui/Table.tsx
import React from "react";

export default function Table({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table className={`w-full text-sm border-collapse ${className}`}>{children}</table>
  );
}
