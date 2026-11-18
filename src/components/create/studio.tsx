"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VideoThumb } from "@/components/video/video-thumb";
import { useVideos } from "@/hooks/use-videos";
import { createClient } from "@/lib/supabase/client";
import { isPending, MAX_PROMPT_LENGTH, type AspectRatio, type Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AspectPicker } from "./aspect-picker";
import { ImageDropzone, type PickedImage } from "./image-dropzone";
import { Stage } from "./stage";

const IDEAS = [
  { label: "Coastal drone", prompt: "A slow aerial drone shot gliding over turquoise waves crashing against black volcanic cliffs at sunrise, mist rising, cinematic, 35mm film grain" },
  { label: "Neon city", prompt: "Handheld tracking shot through a rain-soaked neon alley in Tokyo at night, reflections in puddles, steam rising from vents, shallow depth of field" },
  { label: "Product hero", prompt: "A sleek glass perfume bottle rotating slowly on a black marble pedestal, soft rim lighting, golden particles drifting, macro lens, studio commercial" },
  { label: "Cozy morning", prompt: "Close-up of coffee being poured into a ceramic mug beside a rainy window, warm morning light, steam curling, slow motion" },
];

type Phase = "idle" | "uploading" | "starting";

export function Studio({ userId, initialVideos }: { userId: string; initialVideos: Video[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initialVideos.find((v) => isPending(v.status))?.id ?? null,
  );

  const onSettled = useCallback((v: Video) => {
    if (v.status === "completed") {
      toast.success("Your video is ready", {
        description: v.prompt.length > 70 ? `${v.prompt.slice(0, 70)}…` : v.prompt,
        action: { label: "View", onClick: () => setSelectedId(v.id) },
      });
    } else {
      toast.error("Generation failed", { description: v.errorMessage ?? undefined });
    }
  }, []);

  const { videos, upsert } = useVideos(initialVideos, { onSettled });
  const selected = useMemo(() => videos.find((v) => v.id === selectedId) ?? null, [videos, selectedId]);

  // Composer state
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [promptError, setPromptError] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const busy = phase !== "idle";

  const generate = async () => {
    if (busy) return;
    const text = prompt.trim();
    if (text.length < 3) {
      setPromptError("Describe your video in at least a few words.");
      promptRef.current?.focus();
      return;
    }
    setPromptError(null);

    try {
      let imagePath = image?.uploadedPath ?? null;
      if (image && !imagePath) {
        setPhase("uploading");
        const ext = image.file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await createClient()
          .storage.from("inputs")
          .upload(path, image.file, { contentType: image.file.type, cacheControl: "3600" });
        if (error) {
          toast.error("Couldn't upload your image", { description: error.message });
          return;
        }
        imagePath = path;
        setImage((img) => (img ? { ...img, uploadedPath: path } : img));
      }

      setPhase("starting");
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, aspectRatio, imagePath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't start generation", { description: data.error ?? "Please try again." });
        return;
      }
      upsert(data.video);
      setSelectedId(data.video.id);
      if (window.innerWidth < 1024) {
        document.getElementById("stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      toast.error("Network error", { description: "Check your connection and try again." });
    } finally {
      setPhase("idle");
    }
  };

  const remix = (v: Video) => {
    setPrompt(v.prompt);
    setAspectRatio(v.aspectRatio);
    setPromptError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => {
      const el = promptRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const pendingCount = videos.filter((v) => isPending(v.status)).length;
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="mx-auto grid w-full max-w-[1400px] flex-1 items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:py-8 xl:grid-cols-[440px_minmax(0,1fr)]">
      {/* ---------------- Composer ---------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-pop)] sm:p-6 lg:sticky lg:top-24"
        aria-label="Create a video"
      >
        <div>
          <h1 className="font-display text-[34px] leading-[1.05] tracking-tight">
            What should we <em className="text-gradient">film</em>?
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Describe the subject, the motion and the camera. Specific beats generic.
          </p>
        </div>

        <div>
          <label htmlFor="prompt" className="mb-2 block text-[13px] font-medium text-fg-muted">
            Prompt
          </label>
          <div
            className={cn(
              "rounded-xl border border-line-strong bg-canvas/40 transition-colors focus-within:border-accent/70 focus-within:bg-raised focus-within:ring-4 focus-within:ring-accent/15",
              promptError && "border-danger/60",
            )}
          >
            <textarea
              id="prompt"
              ref={promptRef}
              value={prompt}
              disabled={busy}
              maxLength={MAX_PROMPT_LENGTH}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (promptError) setPromptError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  generate();
                }
              }}
              rows={5}
              placeholder="A lone astronaut walks across a field of glowing flowers on an alien planet, two moons rising, slow push-in, dreamy and cinematic…"
              aria-invalid={promptError ? true : undefined}
              aria-describedby="prompt-meta"
              className="block max-h-72 min-h-32 w-full resize-y bg-transparent px-3.5 pt-3 text-[15px] leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none [field-sizing:content]"
            />
            <div id="prompt-meta" className="flex items-center justify-between px-3.5 pt-1 pb-2.5 text-xs">
              <span className={promptError ? "text-danger" : "text-fg-subtle"}>
                {promptError ?? "Tip: mention lighting and camera moves"}
              </span>
              <span className={cn("font-mono tabular-nums", prompt.length > MAX_PROMPT_LENGTH * 0.9 ? "text-glow" : "text-fg-subtle")}>
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 flex items-center gap-1 text-xs text-fg-subtle">
              <Lightbulb className="size-3.5" /> Try
            </span>
            {IDEAS.map((idea) => (
              <button
                key={idea.label}
                type="button"
                disabled={busy}
                onClick={() => {
                  setPrompt(idea.prompt);
                  setPromptError(null);
                }}
                className="rounded-full border border-line bg-raised/60 px-2.5 py-1 text-xs text-fg-muted transition hover:border-line-strong hover:text-fg disabled:opacity-50"
              >
                {idea.label}
              </button>
            ))}
          </div>
        </div>

        <ImageDropzone image={image} onChange={setImage} disabled={busy} />
        <AspectPicker value={aspectRatio} onChange={setAspectRatio} disabled={busy} />

        <div className="flex flex-col gap-2.5">
          <Button type="submit" size="lg" loading={busy} className="w-full">
            {!busy && <Sparkles className="size-4" />}
            {phase === "uploading" ? "Uploading image…" : phase === "starting" ? "Starting…" : "Generate video"}
            {!busy && (
              <kbd className="ml-1 hidden rounded-md bg-black/15 px-1.5 py-0.5 font-sans text-[11px] font-medium sm:inline" suppressHydrationWarning>
                {isMac ? "⌘" : "Ctrl"} ↵
              </kbd>
            )}
          </Button>
          <p className="text-center text-xs text-fg-subtle">
            5-second clip · 720p MP4
            {pendingCount > 0 && (
              <>
                {" · "}
                <span className="text-glow">{pendingCount} generating</span>
              </>
            )}
          </p>
        </div>
      </form>

      {/* ---------------- Stage + recents ---------------- */}
      <section id="stage" aria-label="Preview" className="flex min-w-0 scroll-mt-20 flex-col gap-6">
        <Stage video={selected} draftRatio={aspectRatio} onNew={() => setSelectedId(null)} onRemix={remix} />

        {videos.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-fg">Recent</h2>
              <Link href="/library" className="group flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
                View library <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-3">
              {videos.slice(0, 12).map((v) => (
                <li key={v.id} className="snap-start">
                  <button
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    aria-label={`Show: ${v.prompt}`}
                    aria-pressed={v.id === selectedId}
                    className={cn(
                      "block h-24 overflow-hidden rounded-xl border transition",
                      v.id === selectedId
                        ? "border-accent shadow-[var(--shadow-glow)]"
                        : "border-line-strong opacity-80 hover:opacity-100",
                    )}
                  >
                    <VideoThumb video={v} className="h-full" compactBadge />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
