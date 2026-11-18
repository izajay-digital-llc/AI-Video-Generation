export const ASPECT_RATIOS = ["16:9", "9:16"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const VIDEO_STATUSES = ["queued", "processing", "completed", "failed"] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export const isPending = (s: VideoStatus) => s === "queued" || s === "processing";

/** Database row shape for `public.videos`. */
export type VideoRow = {
  id: string;
  user_id: string;
  prompt: string;
  aspect_ratio: AspectRatio;
  input_image_path: string | null;
  status: VideoStatus;
  provider: string;
  provider_job_id: string | null;
  video_path: string | null;
  remote_video_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

/** What the browser receives. Never exposes storage paths or provider ids. */
export type Video = {
  id: string;
  prompt: string;
  aspectRatio: AspectRatio;
  status: VideoStatus;
  videoUrl: string | null;
  inputImageUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export const MAX_PROMPT_LENGTH = 2000;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
