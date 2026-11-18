"use client";

import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

/**
 * Media surface for a video in any state. Completed videos show their first
 * frame and play muted on hover; pending ones shimmer over the input image.
 */
export function VideoThumb({
  video,
  className,
  hoverPlay = true,
  showBadge = true,
  compactBadge = false,
}: {
  video: Video;
  className?: string;
  hoverPlay?: boolean;
  showBadge?: boolean;
  compactBadge?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const ready = video.status === "completed" && video.videoUrl;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-raised",
        video.aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video",
        className,
      )}
      onMouseEnter={() => hoverPlay && ref.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (!hoverPlay || !ref.current) return;
        ref.current.pause();
        ref.current.currentTime = 0.1;
      }}
    >
      {ready ? (
        <video
          ref={ref}
          src={`${video.videoUrl}#t=0.1`}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          {video.inputImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.inputImageUrl}
              alt=""
              className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-md"
            />
          )}
          {video.status === "failed" ? (
            <div className="absolute inset-0 grid place-items-center bg-danger-soft">
              <AlertTriangle className="size-6 text-danger/80" aria-hidden />
            </div>
          ) : (
            <div className="shimmer absolute inset-0" />
          )}
        </>
      )}
      {showBadge && video.status !== "completed" && (
        <StatusBadge status={video.status} compact={compactBadge} className="absolute top-2 left-2" />
      )}
    </div>
  );
}
