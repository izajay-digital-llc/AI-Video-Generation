import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LibraryView } from "@/components/library/library-view";
import { getUser } from "@/lib/supabase/server";
import type { VideoRow } from "@/lib/types";
import { toVideos, VIDEO_COLUMNS } from "@/lib/videos";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<VideoRow[]>();

  return <LibraryView initialVideos={await toVideos(supabase, data ?? [])} />;
}
