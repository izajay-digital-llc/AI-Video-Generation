import "server-only";
import type { GenerationRequest, GenerationState, VideoProvider } from "./types";

// CC0 sample clips from MDN. The mock returns the same footage for both
// formats; the UI still frames it in the requested aspect ratio.
const SAMPLES = {
  "16:9": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "9:16": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
} as const;

const QUEUE_MS = 4_000;
const TOTAL_MS = 20_000;

/**
 * Simulated provider for local development and demos: no API key, no cost.
 * State is encoded in the job id, so it survives server restarts.
 * Include the word "fail" in a prompt to exercise the error path.
 */
export class MockProvider implements VideoProvider {
  readonly name = "mock";

  async createGeneration({ prompt, aspectRatio }: GenerationRequest) {
    const payload = { t: Date.now(), ar: aspectRatio, fail: /\bfail\b/i.test(prompt) };
    return { jobId: `mock_${Buffer.from(JSON.stringify(payload)).toString("base64url")}` };
  }

  async getGeneration(jobId: string): Promise<GenerationState> {
    const { t, ar, fail } = JSON.parse(
      Buffer.from(jobId.replace(/^mock_/, ""), "base64url").toString(),
    ) as { t: number; ar: keyof typeof SAMPLES; fail: boolean };
    const elapsed = Date.now() - t;
    if (elapsed < QUEUE_MS) return { status: "queued" };
    if (elapsed < TOTAL_MS) return { status: "processing" };
    if (fail) return { status: "failed", error: "Simulated failure: the prompt asked for it." };
    return { status: "completed", videoUrl: SAMPLES[ar] ?? SAMPLES["16:9"] };
  }
}
