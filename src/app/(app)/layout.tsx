import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { getUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email ?? ""} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
