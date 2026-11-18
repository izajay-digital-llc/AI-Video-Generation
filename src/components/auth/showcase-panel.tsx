/**
 * Decorative right-hand panel on auth pages: an aurora backdrop with a
 * stack of "frames" that hint at what the product makes. Pure CSS, no media.
 */
export function ShowcasePanel() {
  return (
    <aside
      aria-hidden
      className="relative hidden overflow-hidden border-l border-line bg-surface lg:block"
    >
      <div className="absolute inset-0">
        <div className="absolute -top-1/4 -left-1/4 size-[80%] animate-aurora rounded-full bg-[radial-gradient(circle,rgb(255_107_61/0.35),transparent_60%)] blur-3xl" />
        <div className="absolute -right-1/4 -bottom-1/4 size-[80%] animate-aurora rounded-full bg-[radial-gradient(circle,rgb(122_162_255/0.22),transparent_60%)] blur-3xl [animation-delay:-7s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
        <div className="relative mx-auto mt-10 h-[420px] w-full max-w-[520px]">
          {/* Landscape frame */}
          <Frame
            className="absolute top-0 left-0 w-[78%] -rotate-3"
            ratio="aspect-video"
            gradient="from-[#2a1208] via-[#7a2e12] to-[#ffb547]"
            caption="Golden hour over a desert highway, slow dolly"
            badge="16:9"
          />
          {/* Portrait frame */}
          <Frame
            className="absolute top-16 right-0 w-[34%] rotate-[4deg]"
            ratio="aspect-[9/16]"
            gradient="from-[#0b1430] via-[#1d3b7a] to-[#7aa2ff]"
            caption="Neon rain, handheld"
            badge="9:16"
          />
          {/* Generating chip */}
          <div className="absolute bottom-6 left-[12%] flex items-center gap-3 rounded-full border border-line-strong bg-black/60 py-2 pr-4 pl-2 text-sm backdrop-blur-md">
            <span className="grid size-7 place-items-center rounded-full bg-accent-soft">
              <span className="size-2 animate-pulse-soft rounded-full bg-accent" />
            </span>
            <span className="text-fg">Generating</span>
            <span className="font-mono text-xs text-fg-muted">0:24</span>
          </div>
        </div>

        <div>
          <p className="font-display text-5xl leading-[1.05] tracking-tight text-fg xl:text-6xl">
            Direct the shot.
            <br />
            <em className="text-gradient">Skip the shoot.</em>
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">
            Describe a scene or drop in a still, pick your frame, and get a five-second clip
            ready for Reels, Shorts or the big screen.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Frame({
  className,
  ratio,
  gradient,
  caption,
  badge,
}: {
  className: string;
  ratio: string;
  gradient: string;
  caption: string;
  badge: string;
}) {
  return (
    <div className={`${className} rounded-2xl border border-white/10 bg-black/40 p-1.5 shadow-[var(--shadow-pop)] backdrop-blur`}>
      <div className={`relative ${ratio} overflow-hidden rounded-[14px] bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(255_255_255/0.25),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-2.5 left-2.5 rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur">
          {badge}
        </span>
        <p className="absolute right-3 bottom-2.5 left-3 line-clamp-2 font-mono text-[11px] leading-snug text-white/85">
          {caption}
        </p>
      </div>
    </div>
  );
}
