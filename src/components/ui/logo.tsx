import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="fs-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB547" />
          <stop offset="1" stopColor="#FF6B3D" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="20" height="20" rx="5" fill="none" stroke="url(#fs-g)" strokeWidth="2.5" />
      <rect x="10" y="2" width="20" height="20" rx="5" fill="url(#fs-g)" opacity="0.95" />
      <path d="M17.5 8.5v7l5.5-3.5z" fill="#1a0a04" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Frameshift home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-fg">Frameshift</span>
    </Link>
  );
}
