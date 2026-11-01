import { useEffect, useRef, useState } from "react";

const FOCUS_INTERVAL_SECONDS = 300;

interface UseStudyTimerProps {
  taskId?: string | number | null;
  initialActiveSeconds?: number;
  addActivityXP: (amount: number, reason: string, description?: string) => void;
  recordActiveSeconds: (taskId: string | number, seconds: number) => void;
}

export default function useStudyTimer({
  taskId,
  initialActiveSeconds = 0,
  addActivityXP,
  recordActiveSeconds,
}: UseStudyTimerProps) {
  const [activeSeconds, setActiveSeconds] = useState(initialActiveSeconds);
  const activeSecondsRef = useRef(initialActiveSeconds);

  useEffect(() => {
    activeSecondsRef.current = Math.max(0, Number(initialActiveSeconds) || 0);
    setActiveSeconds(activeSecondsRef.current);
  }, [taskId, initialActiveSeconds]);

  useEffect(() => {
    if (!taskId) return undefined;

    let pendingSeconds = 0;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;

      activeSecondsRef.current += 1;
      pendingSeconds += 1;
      setActiveSeconds(activeSecondsRef.current);

      if (pendingSeconds >= 5) {
        recordActiveSeconds(taskId, pendingSeconds);
        pendingSeconds = 0;
      }

      if (activeSecondsRef.current % FOCUS_INTERVAL_SECONDS === 0) {
        const intervalNumber = Math.floor(
          activeSecondsRef.current / FOCUS_INTERVAL_SECONDS
        );

        addActivityXP(
          1,
          `focus:${taskId}:${intervalNumber}`,
          "Five minutes of active study"
        );
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);

      if (pendingSeconds > 0) {
        recordActiveSeconds(taskId, pendingSeconds);
      }
    };
  }, [taskId, addActivityXP, recordActiveSeconds]);

  return {
    activeSeconds,
    formattedTime: [
      Math.floor(activeSeconds / 3600),
      Math.floor((activeSeconds % 3600) / 60),
      activeSeconds % 60,
    ]
      .map((value) => String(value).padStart(2, "0"))
      .join(":"),
  };
}
