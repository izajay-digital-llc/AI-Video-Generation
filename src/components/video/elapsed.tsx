"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";

/** Ticking mm:ss counter since `since`. */
export function useElapsed(since: string, running = true) {
  // Start at null so server and client render identically; the clock starts after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    if (!running) return () => clearTimeout(first);
    const id = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [running]);
  return now === null ? 0 : Math.max(0, now - new Date(since).getTime());
}

export function Elapsed({ since, className }: { since: string; className?: string }) {
  const ms = useElapsed(since);
  return (
    <span className={className} suppressHydrationWarning>
      {formatDuration(ms)}
    </span>
  );
}
