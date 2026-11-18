import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import type { VideoRow } from "@/lib/types";
import { syncVideo, toVideo, VIDEO_COLUMNS } from "@/lib/videos";

const UUID = /^[0-9a-f-]{36}$/i;

/** Returns a video and, if it's still generating, refreshes its status first. */
export async function GET(_req: Request, ctx: RouteContext<"/api/videos/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return jsonError("Video not found.", 404);

  const { supabase, user } = await getUser();
  if (!user) return jsonError("Please sign in.", 401);

  const { data: row } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("id", id)
    .maybeSingle<VideoRow>();
  if (!row) return jsonError("Video not found.", 404);

  const synced = await syncVideo(row);
  return NextResponse.json(
    { video: await toVideo(supabase, synced) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/videos/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return jsonError("Video not found.", 404);

  const { supabase, user } = await getUser();
  if (!user) return jsonError("Please sign in.", 401);

  const { data: row } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("id", id)
    .maybeSingle<VideoRow>();
  if (!row) return jsonError("Video not found.", 404);

  // The read above went through RLS, so the user owns this row.
  const admin = createAdminClient();
  const { error } = await admin.from("videos").delete().eq("id", id).eq("user_id", user.id);
  if (error) return jsonError("Could not delete this video.", 500);

  // Best-effort media cleanup; the row is already gone.
  await Promise.all([
    row.video_path && admin.storage.from("videos").remove([row.video_path]),
    row.input_image_path && admin.storage.from("inputs").remove([row.input_image_path]),
  ]);

  return new NextResponse(null, { status: 204 });
}
