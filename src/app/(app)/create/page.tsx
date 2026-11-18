import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Studio } from "@/components/create/studio";
import { getUser } from "@/lib/supabase/server";
import type { VideoRow } from "@/lib/types";
import { toVideos, VIDEO_COLUMNS } from "@/lib/videos";

export const metadata: Metadata = { title: "Create" };

export default async function CreatePage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<VideoRow[]>();

  return <Studio userId={user.id} initialVideos={await toVideos(supabase, data ?? [])} />;
}
