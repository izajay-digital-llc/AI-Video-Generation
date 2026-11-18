import "server-only";
import { ProviderError, type GenerationRequest, type GenerationState, type VideoProvider } from "./types";

const BASE_URL = "https://api.lumalabs.ai/dream-machine/v1";

type LumaGeneration = {
  id: string;
  state: "queued" | "dreaming" | "completed" | "failed";
  failure_reason?: string | null;
  assets?: { video?: string | null } | null;
};

/** Luma Dream Machine — https://docs.lumalabs.ai/docs/api */
export class LumaProvider implements VideoProvider {
  readonly name = "luma";

  constructor(
    private readonly apiKey: string,
    private readonly model = "ray-2",
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body?.detail ?? body?.message ?? JSON.stringify(body);
      } catch {}
      if (res.status === 401 || res.status === 403)
        throw new ProviderError("The video service rejected our API key.", 502);
      if (res.status === 429)
        throw new ProviderError("The video service is busy right now. Try again in a minute.", 429);
      if (res.status === 400 || res.status === 422)
        throw new ProviderError(`The video service couldn't accept this request: ${detail}`, 400);
      throw new ProviderError(`Video service error (${res.status}): ${detail}`);
    }
    return res.json() as Promise<T>;
  }

  async createGeneration({ prompt, aspectRatio, imageUrl }: GenerationRequest) {
    const gen = await this.request<LumaGeneration>("/generations", {
      method: "POST",
      body: JSON.stringify({
        generation_type: "video",
        model: this.model,
        prompt,
        aspect_ratio: aspectRatio,
        resolution: "720p",
        duration: "5s",
        ...(imageUrl && { keyframes: { frame0: { type: "image", url: imageUrl } } }),
      }),
    });
    return { jobId: gen.id };
  }

  async getGeneration(jobId: string): Promise<GenerationState> {
    const gen = await this.request<LumaGeneration>(`/generations/${encodeURIComponent(jobId)}`);
    switch (gen.state) {
      case "queued":
        return { status: "queued" };
      case "dreaming":
        return { status: "processing" };
      case "completed":
        return gen.assets?.video
          ? { status: "completed", videoUrl: gen.assets.video }
          : { status: "failed", error: "Generation finished without a video file." };
      case "failed":
      default:
        return { status: "failed", error: gen.failure_reason || "The video could not be generated." };
    }
  }
}
