"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Download, Film, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/video/status-badge";
import { VideoThumb } from "@/components/video/video-thumb";
import { deleteVideo, useVideos } from "@/hooks/use-videos";
import { isPending, type Video } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

type Filter = "all" | "16:9" | "9:16";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "16:9", label: "Landscape" },
  { value: "9:16", label: "Portrait" },
];

export function LibraryView({ initialVideos }: { initialVideos: Video[] }) {
  const { videos, upsert, remove } = useVideos(initialVideos, {
    onSettled: (v) =>
      v.status === "completed"
        ? toast.success("A video just finished", { description: v.prompt.slice(0, 70) })
        : toast.error("A generation failed", { description: v.errorMessage ?? undefined }),
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Video | null>(null);

  const shown = useMemo(
    () => (filter === "all" ? videos : videos.filter((v) => v.aspectRatio === filter)),
    [videos, filter],
  );
  const viewing = videos.find((v) => v.id === viewingId) ?? null;
  const pending = videos.filter((v) => isPending(v.status)).length;

  const confirmDelete = async () => {
    if (!confirming) return;
    const v = confirming;
    setConfirming(null);
    if (viewingId === v.id) setViewingId(null);
    await deleteVideo(v, remove, upsert);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[44px] leading-none tracking-tight">Library</h1>
          <p className="mt-2 text-sm text-fg-muted">
            {videos.length === 0
              ? "Everything you generate lands here."
              : `${videos.length} video${videos.length === 1 ? "" : "s"}`}
            {pending > 0 && <span className="text-glow"> · {pending} generating</span>}
          </p>
        </div>
        {videos.length > 0 && (
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="Filter by format" className="flex rounded-xl border border-line bg-surface p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                    filter === f.value ? "bg-raised text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Link href="/create" className={buttonClasses("primary", "md", "hidden sm:inline-flex")}>
              <Plus className="size-4" /> New video
            </Link>
          </div>
        )}
      </header>

      {videos.length === 0 ? (
        <EmptyLibrary />
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong p-12 text-center text-sm text-fg-muted">
          No {filter === "16:9" ? "landscape" : "portrait"} videos yet.
        </p>
      ) : (
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4">
          {shown.map((v, i) => (
            <li
              key={v.id}
              className="mb-4 animate-fade-in break-inside-avoid"
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
            >
              <VideoCard video={v} onOpen={() => setViewingId(v.id)} onDelete={() => setConfirming(v)} />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!viewing}
        onClose={() => setViewingId(null)}
        label="Video details"
        className={cn("max-w-5xl", viewing?.aspectRatio === "9:16" && "max-w-3xl")}
      >
        {viewing && <Viewer video={viewing} onDelete={() => setConfirming(viewing)} />}
      </Dialog>

      <Dialog open={!!confirming} onClose={() => setConfirming(null)} label="Delete video" className="max-w-sm" hideClose>
        <div className="p-6">
          <span className="grid size-11 place-items-center rounded-xl border border-danger/30 bg-danger-soft">
            <Trash2 className="size-5 text-danger" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Delete this video?</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            It will be removed from your library and storage. This can&apos;t be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirming(null)} autoFocus>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function VideoCard({ video, onOpen, onDelete }: { video: Video; onOpen: () => void; onDelete: () => void }) {
  const ready = video.status === "completed";
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-line-strong hover:shadow-[var(--shadow-pop)]">
      <div className="relative">
        <button type="button" onClick={onOpen} className="block w-full" aria-label={`Open video: ${video.prompt}`}>
          <VideoThumb video={video} className="w-full" />
        </button>
        <span className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur">
          {video.aspectRatio}
        </span>
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          {ready && (
            <a
              href={`/api/videos/${video.id}/download`}
              download
              aria-label="Download MP4"
              title="Download MP4"
              className="grid size-8 place-items-center rounded-lg bg-black/60 text-white/85 backdrop-blur transition hover:bg-black/80 hover:text-white"
            >
              <Download className="size-4" />
            </a>
          )}
          {!isPending(video.status) && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete video"
              title="Delete"
              className="grid size-8 place-items-center rounded-lg bg-black/60 text-white/85 backdrop-blur transition hover:bg-danger hover:text-white"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-start gap-3 p-3.5">
        <p className="line-clamp-2 flex-1 text-sm leading-snug text-fg-muted">{video.prompt}</p>
        <time dateTime={video.createdAt} className="shrink-0 pt-0.5 text-xs text-fg-subtle" suppressHydrationWarning>
          {timeAgo(video.createdAt)}
        </time>
      </div>
    </article>
  );
}

function Viewer({ video, onDelete }: { video: Video; onDelete: () => void }) {
  const portrait = video.aspectRatio === "9:16";
  return (
    <div className={cn("flex flex-col", portrait && "md:flex-row")}>
      <div className={cn("relative bg-black", portrait ? "md:w-[55%]" : "w-full", "overflow-hidden rounded-t-2xl", portrait && "md:rounded-l-2xl md:rounded-tr-none")}>
        {video.status === "completed" && video.videoUrl ? (
          <video
            key={video.id}
            src={video.videoUrl}
            controls
            autoPlay
            loop
            playsInline
            className={cn("mx-auto block w-full", portrait ? "aspect-[9/16] max-h-[78dvh] object-contain" : "aspect-video max-h-[65dvh] object-contain")}
          />
        ) : (
          <VideoThumb video={video} hoverPlay={false} className={cn("w-full", portrait && "max-h-[78dvh]")} />
        )}
      </div>
      <div className={cn("flex flex-col gap-5 p-5 sm:p-6", portrait && "md:flex-1")}>
        <div className="flex flex-wrap items-center gap-2 pr-10">
          <StatusBadge status={video.status} className="bg-raised" />
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-fg-muted">
            {video.aspectRatio} · {portrait ? "Portrait" : "Landscape"}
          </span>
          <time dateTime={video.createdAt} className="text-xs text-fg-subtle">
            {new Date(video.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </time>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-wider text-fg-subtle uppercase">Prompt</h3>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(video.prompt).then(() => toast.success("Prompt copied"))}
              className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
            >
              <Copy className="size-3" /> Copy
            </button>
          </div>
          <p className="max-h-40 overflow-y-auto text-[15px] leading-relaxed text-fg">{video.prompt}</p>
        </div>

        {video.inputImageUrl && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium tracking-wider text-fg-subtle uppercase">Starting image</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.inputImageUrl} alt="Starting frame" className="h-20 rounded-lg border border-line object-cover" />
          </div>
        )}

        {video.status === "failed" && video.errorMessage && (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-[#ffb3b5]">{video.errorMessage}</p>
        )}

        <div className={cn("flex flex-wrap gap-2", portrait && "md:mt-auto")}>
          {video.status === "completed" && (
            <a href={`/api/videos/${video.id}/download`} download className={buttonClasses("primary", "md")}>
              <Download className="size-4" /> Download MP4
            </a>
          )}
          {!isPending(video.status) && (
            <Button variant="secondary" onClick={onDelete} className="hover:border-danger/40 hover:text-danger">
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-line bg-surface px-6 py-20 text-center">
      <div aria-hidden className="absolute -top-32 size-96 rounded-full bg-[radial-gradient(circle,rgb(255_107_61/0.18),transparent_65%)] blur-2xl" />
      <div className="relative mb-6 flex items-end gap-3" aria-hidden>
        <span className="h-16 w-28 -rotate-6 rounded-lg border border-line-strong bg-raised" />
        <span className="grid h-24 w-14 place-items-center rounded-lg border border-accent/40 bg-accent-soft">
          <Film className="size-5 text-accent" />
        </span>
        <span className="h-16 w-28 rotate-6 rounded-lg border border-line-strong bg-raised" />
      </div>
      <h2 className="relative font-display text-3xl tracking-tight">Your library is empty</h2>
      <p className="relative mt-2 max-w-sm text-sm text-fg-muted">
        Generate your first clip and it&apos;ll show up here, ready to watch, download or share.
      </p>
      <Link href="/create" className={buttonClasses("primary", "lg", "relative mt-7")}>
        <Sparkles className="size-4" /> Create your first video
      </Link>
    </div>
  );
}
