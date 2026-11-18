import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getUser } from "@/lib/supabase/server";
import type { VideoRow } from "@/lib/types";
import { downloadFilename, VIDEO_COLUMNS } from "@/lib/videos";

/** Sends the MP4 as an attachment with a readable filename. */
export async function GET(_req: Request, ctx: RouteContext<"/api/videos/[id]/download">) {
  const { id } = await ctx.params;
  const { supabase, user } = await getUser();
  if (!user) return jsonError("Please sign in.", 401);

  const { data: row } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("id", id)
    .maybeSingle<VideoRow>();
  if (!row || row.status !== "completed") return jsonError("Video not found.", 404);

  const filename = downloadFilename(row);

  if (row.video_path) {
    const { data } = await supabase.storage
      .from("videos")
      .createSignedUrl(row.video_path, 60, { download: filename });
    if (data?.signedUrl) return NextResponse.redirect(data.signedUrl);
  }

  if (row.remote_video_url) {
    const upstream = await fetch(row.remote_video_url, { cache: "no-store" });
    if (upstream.ok && upstream.body) {
      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${filename}"`,
          ...(upstream.headers.get("content-length") && {
            "Content-Length": upstream.headers.get("content-length")!,
          }),
        },
      });
    }
  }

  return jsonError("This video file is no longer available.", 410);
}
