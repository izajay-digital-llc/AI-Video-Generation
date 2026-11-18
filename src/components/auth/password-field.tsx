"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Field> & { showStrength?: boolean };

function score(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-danger", "bg-danger", "bg-glow", "bg-success", "bg-success"];

export function PasswordField({ showStrength, onChange, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const s = score(value);

  return (
    <div className="relative">
      <Field
        {...props}
        type={visible ? "text" : "password"}
        className="pr-11"
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-[30px] right-1.5 grid size-8 place-items-center rounded-lg text-fg-subtle transition hover:bg-white/5 hover:text-fg"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      {showStrength && value.length > 0 && (
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn("h-1 flex-1 rounded-full bg-white/10 transition-colors", i < s && COLORS[s])}
              />
            ))}
          </div>
          <span className="w-16 text-right text-xs text-fg-muted">{LABELS[value.length < 8 ? 0 : s]}</span>
        </div>
      )}
    </div>
  );
}
