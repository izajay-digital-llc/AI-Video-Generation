import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProvider, type GenerationState } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPending, type Video, type VideoRow } from "@/lib/types";

const SIGNED_URL_TTL = 60 * 60 * 6; // 6 hours
const STALE_AFTER_MS = 30 * 60 * 1000; // give up on jobs pending for 30 min

export const VIDEO_COLUMNS =
  "id,user_id,prompt,aspect_ratio,input_image_path,status,provider,provider_job_id,video_path,remote_video_url,error_message,created_at,updated_at,completed_at";

async function signPaths(supabase: SupabaseClient, bucket: string, paths: string[]) {
  const map = new Map<string, string>();
  if (!paths.length) return map;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_TTL);
  data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  return map;
}

/** Converts rows to browser-safe DTOs with short-lived signed media URLs. */
export async function toVideos(supabase: SupabaseClient, rows: VideoRow[]): Promise<Video[]> {
  const [videos, images] = await Promise.all([
    signPaths(supabase, "videos", rows.flatMap((r) => (r.video_path ? [r.video_path] : []))),
    signPaths(supabase, "inputs", rows.flatMap((r) => (r.input_image_path ? [r.input_image_path] : []))),
  ]);

  return rows.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    aspectRatio: r.aspect_ratio,
    status: r.status,
    videoUrl: (r.video_path && videos.get(r.video_path)) || r.remote_video_url,
    inputImageUrl: (r.input_image_path && images.get(r.input_image_path)) || null,
    errorMessage: r.error_message,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}

export async function toVideo(supabase: SupabaseClient, row: VideoRow) {
  return (await toVideos(supabase, [row]))[0];
}

/** Copies the provider's file into our own storage so links never expire. */
async function persistVideo(path: string, url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Download failed with ${res.status}`);
    const body = await res.arrayBuffer();
    const { error } = await createAdminClient()
      .storage.from("videos")
      .upload(path, body, { contentType: "video/mp4", upsert: true });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[videos] could not persist video, falling back to provider URL", err);
    return false;
  }
}

/**
 * Asks the provider for the latest state of a pending job and records any
 * change. Safe to call repeatedly; completed/failed rows are returned as-is.
 *
 * `row` must already have been read with the user's own client (so RLS has
 * confirmed ownership); the write uses the service role.
 */
export async function syncVideo(row: VideoRow): Promise<VideoRow> {
  if (!isPending(row.status)) return row;

  let state: GenerationState;
  if (!row.provider_job_id || Date.now() - new Date(row.created_at).getTime() > STALE_AFTER_MS) {
    state = { status: "failed", error: "Generation timed out. Please try again." };
  } else {
    try {
      state = await getProvider(row.provider).getGeneration(row.provider_job_id);
    } catch (err) {
      // Treat provider hiccups as transient; the next poll will retry.
      console.error("[videos] status check failed", err);
      return row;
    }
  }

  if (state.status === row.status) return row;

  const now = new Date().toISOString();
  let patch: Partial<VideoRow>;
  if (state.status === "completed") {
    const path = `${row.user_id}/${row.id}.mp4`;
    const saved = await persistVideo(path, state.videoUrl);
    patch = {
      status: "completed",
      video_path: saved ? path : null,
      remote_video_url: state.videoUrl,
      completed_at: now,
    };
  } else if (state.status === "failed") {
    patch = { status: "failed", error_message: state.error, completed_at: now };
  } else {
    patch = { status: state.status };
  }

  const { data } = await createAdminClient()
    .from("videos")
    .update(patch)
    .eq("id", row.id)
    .eq("user_id", row.user_id)
    .select(VIDEO_COLUMNS)
    .single<VideoRow>();

  return data ?? { ...row, ...patch };
}

export function downloadFilename(row: Pick<VideoRow, "prompt" | "id">) {
  const slug = row.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug || "video"}-${row.id.slice(0, 8)}.mp4`;
}
