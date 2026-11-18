import { Logo } from "@/components/ui/logo";
import { ShowcasePanel } from "@/components/auth/showcase-panel";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[380px] animate-fade-up">{children}</div>
        </main>
        <p className="text-xs text-fg-subtle">
          Protected by Supabase Auth · Your videos are private to your account.
        </p>
      </div>
      <ShowcasePanel />
    </div>
  );
}
