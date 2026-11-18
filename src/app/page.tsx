import Link from "next/link";
import { ArrowRight, Download, ImagePlus, RectangleHorizontal, Sparkles } from "lucide-react";
import { ShowcasePanel } from "@/components/auth/showcase-panel";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const FEATURES = [
  { icon: Sparkles, title: "Text to video", body: "Write a scene the way a director would. Get a five-second clip back." },
  { icon: ImagePlus, title: "Animate a still", body: "Drop in a photo or concept frame and bring it to life." },
  { icon: RectangleHorizontal, title: "Made for every feed", body: "Landscape for YouTube, portrait for Reels, TikTok and Shorts." },
  { icon: Download, title: "Yours to keep", body: "A private library of every render, ready to download as MP4." },
];

export default function Home() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo />
          <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16">
          <div className="max-w-xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-xs text-fg-muted">
              <span className="size-1.5 rounded-full bg-accent" /> AI video studio
            </span>
            <h1 className="mt-6 font-display text-[56px] leading-[0.98] tracking-tight sm:text-[72px]">
              Type a scene.
              <br />
              <em className="text-gradient">Watch it play.</em>
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-fg-muted">
              Frameshift turns a sentence or a single image into a cinematic clip in about a minute.
              No cameras, no timeline, no learning curve.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className={buttonClasses("primary", "lg", "group")}>
                Start creating free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className={buttonClasses("secondary", "lg")}>
                I have an account
              </Link>
            </div>
          </div>

          <ul className="mt-16 grid max-w-xl gap-x-8 gap-y-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface">
                  <Icon className="size-4 text-accent" />
                </span>
                <div>
                  <h2 className="text-sm font-medium text-fg">{title}</h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-fg-subtle">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>
      <ShowcasePanel />
    </div>
  );
}
