import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: AspectRatio; label: string; hint: string }[] = [
  { value: "16:9", label: "Landscape", hint: "YouTube & web" },
  { value: "9:16", label: "Portrait", hint: "Reels & Shorts" },
];

export function AspectPicker({
  value,
  onChange,
  disabled,
}: {
  value: AspectRatio;
  onChange: (v: AspectRatio) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-[13px] font-medium text-fg-muted">Format</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={cn(
              "group relative flex cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-canvas/40 p-3 transition-all",
              "hover:border-white/20 hover:bg-raised",
              "has-checked:border-accent/70 has-checked:bg-accent-soft has-checked:shadow-[0_0_0_3px_rgb(255_107_61/0.12)]",
              "has-focus-visible:ring-2 has-focus-visible:ring-accent",
            )}
          >
            <input
              type="radio"
              name="aspectRatio"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span className="grid size-9 shrink-0 place-items-center">
              <span
                className={cn(
                  "rounded-[4px] border-2 border-fg-subtle transition-colors group-has-checked:border-accent group-has-checked:bg-accent/20",
                  o.value === "16:9" ? "h-[22px] w-[38px]" : "h-[38px] w-[22px]",
                )}
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{o.label}</span>
              <span className="block text-xs leading-snug text-fg-subtle">
                <span className="font-mono group-has-checked:text-accent">{o.value}</span> · {o.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
