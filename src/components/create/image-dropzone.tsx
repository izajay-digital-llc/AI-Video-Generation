"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PickedImage = { file: File; previewUrl: string; uploadedPath?: string };

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export function ImageDropzone({
  image,
  onChange,
  disabled,
}: {
  image: PickedImage | null;
  onChange: (img: PickedImage | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File | undefined | null) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError("Use a PNG, JPG or WebP image.");
    if (file.size > MAX_IMAGE_BYTES) return setError("That image is over 10 MB. Try a smaller one.");
    setError(null);
    if (image) URL.revokeObjectURL(image.previewUrl);
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  };

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        accept(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const clear = () => {
    if (image) URL.revokeObjectURL(image.previewUrl);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-fg-muted">Starting image</span>
        <span className="text-xs text-fg-subtle">Optional</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {image ? (
        <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-canvas/40 p-2 pr-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.previewUrl} alt="Selected starting frame" className="size-14 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{image.file.name}</p>
            <p className="text-xs text-fg-subtle">{formatBytes(image.file.size)} · used as the first frame</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            aria-label="Replace image"
            className="grid size-8 place-items-center rounded-lg text-fg-subtle transition hover:bg-white/5 hover:text-fg disabled:opacity-50"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={clear}
            aria-label="Remove image"
            className="grid size-8 place-items-center rounded-lg text-fg-subtle transition hover:bg-white/5 hover:text-danger disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong bg-canvas/40 p-3 text-left transition-colors",
            "hover:border-white/25 hover:bg-raised disabled:opacity-50",
            dragging && "border-accent bg-accent-soft",
            error && "border-danger/50",
          )}
        >
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg bg-raised text-fg-muted", dragging && "text-accent")}>
            <ImagePlus className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm text-fg">
              {dragging ? "Drop to use this image" : (
                <>Drop, paste or <span className="text-accent">browse</span></>
              )}
            </span>
            <span className="block text-xs text-fg-subtle">PNG, JPG or WebP · up to 10 MB</span>
          </span>
        </button>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
