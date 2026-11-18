import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { getProvider, ProviderError } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { ASPECT_RATIOS, MAX_PROMPT_LENGTH, type VideoRow } from "@/lib/types";
import { syncVideo, toVideos, VIDEO_COLUMNS, toVideo } from "@/lib/videos";

const MAX_CONCURRENT = 3;

const createSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Describe your video in at least a few words.")
    .max(MAX_PROMPT_LENGTH, `Keep your prompt under ${MAX_PROMPT_LENGTH} characters.`),
  aspectRatio: z.enum(ASPECT_RATIOS),
  imagePath: z.string().max(512).nullish(),
});

/** Lists the signed-in user's videos, newest first. */
export async function GET(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return jsonError("Please sign in.", 401);

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 60, 200);
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<VideoRow[]>();
  if (error) return jsonError("Could not load your videos.", 500);

  return NextResponse.json({ videos: await toVideos(supabase, data) });
}

/** Starts a new generation. */
export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return jsonError("Please sign in.", 401);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const { prompt, aspectRatio, imagePath } = parsed.data;

  if (imagePath && !imagePath.startsWith(`${user.id}/`)) {
    return jsonError("That image doesn't belong to your account.", 403);
  }

  // Refresh in-flight jobs first so finished ones don't count against the limit.
  const { data: pending } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .in("status", ["queued", "processing"])
    .returns<VideoRow[]>();
  const stillPending = (await Promise.all((pending ?? []).map((r) => syncVideo(r)))).filter(
    (r) => r.status === "queued" || r.status === "processing",
  );
  if (stillPending.length >= MAX_CONCURRENT) {
    return jsonError(
      `You already have ${MAX_CONCURRENT} videos generating. Wait for one to finish.`,
      429,
    );
  }

  let provider, admin;
  try {
    provider = getProvider();
    admin = createAdminClient();
  } catch (err) {
    console.error(err);
    return jsonError("Video generation isn't configured on the server.", 500);
  }

  // Users can't write rows themselves; the server inserts on their behalf.
  const { data: row, error: insertError } = await admin
    .from("videos")
    .insert({
      user_id: user.id,
      prompt,
      aspect_ratio: aspectRatio,
      input_image_path: imagePath ?? null,
      provider: provider.name,
      status: "queued",
    })
    .select(VIDEO_COLUMNS)
    .single<VideoRow>();
  if (insertError || !row) {
    console.error(insertError);
    return jsonError("Could not start your video. Please try again.", 500);
  }

  try {
    let imageUrl: string | undefined;
    if (imagePath) {
      const { data, error } = await supabase.storage
        .from("inputs")
        .createSignedUrl(imagePath, 60 * 60 * 24);
      if (error || !data) throw new ProviderError("We couldn't read your uploaded image.", 400);
      imageUrl = data.signedUrl;
    }

    const { jobId } = await provider.createGeneration({ prompt, aspectRatio, imageUrl });

    const { data: updated } = await admin
      .from("videos")
      .update({ provider_job_id: jobId })
      .eq("id", row.id)
      .eq("user_id", user.id)
      .select(VIDEO_COLUMNS)
      .single<VideoRow>();

    return NextResponse.json({ video: await toVideo(supabase, updated ?? row) }, { status: 201 });
  } catch (err) {
    // Nothing was generated, so don't leave a dead entry in the library.
    await admin.from("videos").delete().eq("id", row.id).eq("user_id", user.id);
    console.error("[videos] create failed", err);
    if (err instanceof ProviderError) return jsonError(err.message, err.status);
    return jsonError("The video service is unavailable. Please try again.", 502);
  }
}
