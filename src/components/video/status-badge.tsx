import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import type { VideoStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<VideoStatus, { label: string; icon: typeof Clock3; className: string }> = {
  queued: { label: "Queued", icon: Clock3, className: "text-fg-muted" },
  processing: { label: "Generating", icon: Loader2, className: "text-glow" },
  completed: { label: "Ready", icon: CheckCircle2, className: "text-success" },
  failed: { label: "Failed", icon: AlertTriangle, className: "text-danger" },
};

export function StatusBadge({
  status,
  className,
  compact,
}: {
  status: VideoStatus;
  className?: string;
  /** Icon only, for small thumbnails. */
  compact?: boolean;
}) {
  const { label, icon: Icon, className: tone } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 text-[11px] font-medium backdrop-blur-md",
        compact ? "size-6 justify-center" : "px-2 py-0.5",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-3", status === "processing" && "animate-spin")} aria-hidden />
      {compact ? <span className="sr-only">{label}</span> : label}
    </span>
  );
}
