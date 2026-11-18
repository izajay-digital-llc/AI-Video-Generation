"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isPending, type Video } from "@/lib/types";

const POLL_MS = 3000;

type Options = {
  /** Called once when a tracked video finishes (completed or failed). */
  onSettled?: (video: Video) => void;
};

/**
 * Holds a list of videos and keeps any that are still generating up to date
 * by polling `/api/videos/:id`. Polling pauses while the tab is hidden and
 * stops automatically once nothing is pending.
 */
export function useVideos(initial: Video[], { onSettled }: Options = {}) {
  const [videos, setVideos] = useState<Video[]>(initial);
  const videosRef = useRef(videos);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);
  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  const upsert = useCallback((video: Video) => {
    setVideos((prev) => {
      const i = prev.findIndex((v) => v.id === video.id);
      if (i === -1) return [video, ...prev];
      const next = prev.slice();
      next[i] = video;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const hasPending = videos.some((v) => isPending(v.status));

  useEffect(() => {
    if (!hasPending) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (document.visibilityState === "visible") {
        const pending = videosRef.current.filter((v) => isPending(v.status));
        await Promise.all(
          pending.map(async (v) => {
            try {
              const res = await fetch(`/api/videos/${v.id}`, { cache: "no-store" });
              if (res.status === 404) return remove(v.id);
              if (!res.ok) return;
              const { video } = (await res.json()) as { video: Video };
              if (cancelled) return;
              upsert(video);
              if (!isPending(video.status)) onSettledRef.current?.(video);
            } catch {
              // Network blip — try again next tick.
            }
          }),
        );
      }
      if (!cancelled) timer = setTimeout(tick, POLL_MS);
    };

    timer = setTimeout(tick, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hasPending, upsert, remove]);

  return { videos, upsert, remove };
}

/** Deletes a video on the server with optimistic UI and an error rollback. */
export async function deleteVideo(video: Video, remove: (id: string) => void, restore: (v: Video) => void) {
  remove(video.id);
  try {
    const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error();
    toast.success("Video deleted");
  } catch {
    restore(video);
    toast.error("Couldn't delete that video. Please try again.");
  }
}
