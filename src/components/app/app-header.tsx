"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, LibraryBig, LogOut, Wand2 } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/create", label: "Create", icon: Wand2 },
  { href: "/library", label: "Library", icon: LibraryBig },
] as const;

export function AppHeader({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/create" className="flex items-center gap-2.5" aria-label="Frameshift — Create">
          <LogoMark />
          <span className="hidden text-[17px] font-semibold tracking-tight sm:inline">Frameshift</span>
        </Link>

        <nav aria-label="Main" className="mx-auto flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors",
                  active ? "bg-raised text-fg shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset]" : "text-fg-muted hover:text-fg",
                )}
              >
                <Icon className={cn("size-4", active && "text-accent")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <UserMenu email={email} />
      </div>
    </header>
  );
}

function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = email.charAt(0).toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-glow to-accent text-sm font-semibold text-[#1a0a04] ring-2 ring-transparent transition hover:ring-white/15"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-11 right-0 w-64 animate-fade-up rounded-xl border border-line-strong bg-raised p-1.5 shadow-[var(--shadow-pop)]"
        >
          <div className="px-3 py-2.5">
            <p className="text-xs text-fg-subtle">Signed in as</p>
            <p className="truncate text-sm font-medium text-fg">{email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            role="menuitem"
            href="/library"
            onClick={() => setOpen(false)}
            className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-fg-muted hover:bg-white/5 hover:text-fg"
          >
            <Clapperboard className="size-4" /> My videos
          </Link>
          <form action={signOut}>
            <button
              role="menuitem"
              type="submit"
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-fg-muted hover:bg-white/5 hover:text-fg"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
