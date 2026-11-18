import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="font-display text-5xl tracking-tight">Cut. Wrong scene.</h1>
      <p className="text-fg-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className={buttonClasses("secondary", "md")}>
        Back to start
      </Link>
    </main>
  );
}
