import "server-only";
import { FalProvider } from "./fal";
import { LumaProvider } from "./luma";
import { MockProvider } from "./mock";
import type { VideoProvider } from "./types";

export * from "./types";

const FAL_DEFAULT_TEXT_MODEL = "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";
const FAL_DEFAULT_IMAGE_MODEL = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

function defaultProvider() {
  if (process.env.VIDEO_PROVIDER) return process.env.VIDEO_PROVIDER;
  if (process.env.LUMA_API_KEY) return "luma";
  if (process.env.FAL_KEY) return "fal";
  return "mock";
}

/**
 * Returns the provider for new jobs, or — given a name stored on a row — the
 * one that created that job, so switching providers never strands old jobs.
 */
export function getProvider(name?: string): VideoProvider {
  const selected = name ?? defaultProvider();

  switch (selected) {
    case "luma": {
      const key = process.env.LUMA_API_KEY;
      if (!key) throw new Error("Luma selected but LUMA_API_KEY is not set.");
      return new LumaProvider(key, process.env.LUMA_MODEL || "ray-2");
    }
    case "fal": {
      const key = process.env.FAL_KEY;
      if (!key) throw new Error("fal selected but FAL_KEY is not set.");
      return new FalProvider(
        key,
        process.env.FAL_TEXT_MODEL || FAL_DEFAULT_TEXT_MODEL,
        process.env.FAL_IMAGE_MODEL || FAL_DEFAULT_IMAGE_MODEL,
      );
    }
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`Unknown video provider: ${selected}`);
  }
}
