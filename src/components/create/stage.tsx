"use client";

import Link from "next/link";
import { AlertTriangle, Check, Download, Film, LibraryBig, Loader2, Plus, Repeat2 } from "lucide-react";
import { buttonClasses, Button } from "@/components/ui/button";
import { useElapsed } from "@/components/video/elapsed";
import type { AspectRatio, Video } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

type StageProps = {
  video: Video | null;
  draftRatio: AspectRatio;
  onNew: () => void;
  onRemix: (v: Video) => void;
};

export function Stage({ video, draftRatio, onNew, onRemix }: StageProps) {
  const ratio = video?.aspectRatio ?? draftRatio;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-surface/60 lg:min-h-[calc(100dvh-15rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"
        />
        <div className="relative flex items-center justify-between px-4 pt-3.5 sm:px-5">
          <span className="font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
            {video ? "Output" : "Preview"} · {ratio}
          </span>
          {video && (
            <Button variant="ghost" size="sm" onClick={onNew}>
              <Plus className="size-3.5" /> New video
            </Button>
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl transition-[width] duration-500 ease-out",
              ratio === "9:16" ? "aspect-[9/16] w-[min(100%,330px)]" : "aspect-video w-full max-w-[920px]",
              video ? "border border-line-strong bg-black shadow-[var(--shadow-pop)]" : "border-2 border-dashed border-line-strong",
            )}
          >
            {!video && <EmptyFrame ratio={ratio} />}
            {video && (video.status === "queued" || video.status === "processing") && <Generating video={video} />}
            {video?.status === "completed" && video.videoUrl && (
              <video
                key={video.id}
                src={video.videoUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 size-full animate-fade-up object-contain"
              />
            )}
            {video?.status === "failed" && <Failed video={video} onRemix={onRemix} />}
          </div>
        </div>
      </div>

      {video && <OutputBar video={video} onRemix={onRemix} />}
    </div>
  );
}

function EmptyFrame({ ratio }: { ratio: AspectRatio }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-line-strong bg-raised">
        <Film className="size-5 text-fg-muted" />
      </span>
      <div>
        <p className="text-sm font-medium text-fg">Your video will appear here</p>
        <p className="mt-1 text-xs text-fg-subtle">
          {ratio === "16:9" ? "Landscape · 1280×720" : "Portrait · 720×1280"} · 5 seconds
        </p>
      </div>
    </div>
  );
}

const STEPS = [
  { key: "queued", label: "Queued" },
  { key: "processing", label: "Rendering frames" },
  { key: "saving", label: "Saving to your library" },
] as const;

function estimateProgress(status: Video["status"], ms: number) {
  const s = ms / 1000;
  if (status === "queued") return Math.min(8, 2 + s * 0.6);
  return Math.min(94, 10 + 84 * (1 - Math.exp(-s / 55)));
}

function Generating({ video }: { video: Video }) {
  const elapsed = useElapsed(video.createdAt);
  const progress = estimateProgress(video.status, elapsed);
  const activeIndex = video.status === "queued" ? 0 : 1;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden" role="status" aria-live="polite">
      {video.inputImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.inputImageUrl} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-xl" />
      )}
      <div className="shimmer absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(255_107_61/0.12),transparent_65%)]" />

      <div className="relative flex w-full max-w-[300px] flex-col items-center gap-5 px-6">
        <div className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent/20 [animation-duration:2.4s]" />
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-glow to-accent opacity-90 blur-[2px]" />
          <Loader2 className="relative size-6 animate-spin text-[#1a0a04]" />
        </div>

        <div className="text-center">
          <p className="text-[15px] font-medium text-fg">
            {video.status === "queued" ? "Waiting for a render slot" : "Generating your video"}
          </p>
          <p className="mt-1 font-mono text-xs text-fg-muted" suppressHydrationWarning>
            {formatDuration(elapsed)} elapsed · usually 1–2 min
          </p>
        </div>

        <div className="w-full">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Estimated progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-glow transition-[width] duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ol className="hidden w-full flex-col gap-2 sm:flex">
          {STEPS.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <li key={step.key} className={cn("flex items-center gap-2.5 text-[13px]", done || active ? "text-fg" : "text-fg-subtle")}>
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border",
                    done && "border-success/40 bg-success/15 text-success",
                    active && "border-accent/50 bg-accent-soft",
                    !done && !active && "border-line-strong",
                  )}
                >
                  {done ? <Check className="size-3" /> : active ? <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" /> : null}
                </span>
                {step.label}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Failed({ video, onRemix }: { video: Video; onRemix: (v: Video) => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_center,rgb(255_90_95/0.1),transparent_70%)] p-6 text-center" role="alert">
      <span className="grid size-12 place-items-center rounded-2xl border border-danger/30 bg-danger-soft">
        <AlertTriangle className="size-5 text-danger" />
      </span>
      <div className="max-w-sm">
        <p className="text-[15px] font-medium text-fg">This one didn&apos;t render</p>
        <p className="mt-1.5 text-sm text-fg-muted">{video.errorMessage ?? "Something went wrong while generating."}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => onRemix(video)}>
        <Repeat2 className="size-3.5" /> Edit &amp; retry
      </Button>
    </div>
  );
}

function OutputBar({ video, onRemix }: { video: Video; onRemix: (v: Video) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/60 p-3 sm:flex-row sm:items-center sm:p-3.5 sm:pl-5">
      <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-fg-muted" title={video.prompt}>
        {video.prompt}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onRemix(video)} title="Load this prompt into the editor">
          <Repeat2 className="size-3.5" /> Remix
        </Button>
        {video.status === "completed" && (
          <>
            <Link href="/library" className={buttonClasses("secondary", "sm")}>
              <LibraryBig className="size-3.5" /> Library
            </Link>
            <a href={`/api/videos/${video.id}/download`} download className={buttonClasses("primary", "sm")}>
              <Download className="size-3.5" /> Download MP4
            </a>
          </>
        )}
      </div>
    </div>
  );
}
