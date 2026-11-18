"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label: string;
  hideClose?: boolean;
};

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Dialog({ open, onClose, children, className, label, hideClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-[var(--shadow-pop)] backdrop:bg-black/70",
        className,
      )}
    >
      {open && (
        <div className="relative">
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/50 text-fg-muted backdrop-blur transition hover:bg-black/70 hover:text-fg"
            >
              <X className="size-4" />
            </button>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
