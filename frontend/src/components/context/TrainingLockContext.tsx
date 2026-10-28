// frontend/src/components/context/TrainingLockContext.tsx

import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../../api/api";

type TrainingLockContextType = {
  locked: boolean;
  offline: boolean;
};

const TrainingLockContext = createContext<TrainingLockContextType>({
  locked: false,
  offline: false
});

export function TrainingLockProvider({ children }: any) {

  const [locked, setLocked] = useState(false);
  const [offline, setOffline] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const offlineCounter = useRef(0);

  // ============================================================
  // SAFE FETCH
  // ============================================================
  async function fetchStatusOnce() {

    try {

      const res = await api.get("/system/training-status", {
        timeout: 4000
      });

      offlineCounter.current = 0;

      if (offline) setOffline(false);

      const running = Boolean(res.data?.running);

      setLocked(running);

      return running;

    } catch (err) {

      offlineCounter.current += 1;

      if (offlineCounter.current >= 3) {
        setOffline(true);
      }

      return false;
    }
  }

  // ============================================================
  // POLLING
  // ============================================================

  function stopPolling() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startRunningPoll() {

    stopPolling();

    intervalRef.current = window.setInterval(async () => {

      const running = await fetchStatusOnce();

      if (!running) {
        startIdlePoll();
      }

    }, 5000);
  }

  function startIdlePoll() {

    stopPolling();

    intervalRef.current = window.setInterval(async () => {

      const running = await fetchStatusOnce();

      if (running) {
        startRunningPoll();
      }

    }, 30000);
  }

  // ============================================================
  // ON MOUNT
  // ============================================================

  useEffect(() => {

    let active = true;

    async function init() {

      const running = await fetchStatusOnce();

      if (!active) return;

      if (running) {
        startRunningPoll();
      } else {
        startIdlePoll();
      }
    }

    init();

    return () => {
      active = false;
      stopPolling();
    };

  }, []);

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <TrainingLockContext.Provider value={{ locked, offline }}>
        {children}
      </TrainingLockContext.Provider>

      {locked && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex flex-col items-center justify-center text-white text-xl font-semibold">
          <div>🔒 Sistem sedang training model...</div>
          <div className="mt-4 animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {offline && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white px-4 py-2 rounded-full text-sm shadow-lg">
          🔌 Backend Offline — retrying...
        </div>
      )}
    </>
  );
}

export function useTrainingLock() {
  return useContext(TrainingLockContext);
}