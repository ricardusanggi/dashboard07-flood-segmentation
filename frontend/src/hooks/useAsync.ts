// path :   frontend/src/hooks/useAsync.ts
import { useState } from "react";

export function useAsync<T extends (...args: any[]) => Promise<any>>(fn: T) {
  const [loading, setLoading] = useState(false);

  const run = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    setLoading(true);
    try {
      return await fn(...args);
    } finally {
      setLoading(false);
    }
  };

  return { run, loading };
}
}