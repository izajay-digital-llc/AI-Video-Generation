import type { AspectRatio } from "@/lib/types";

export type GenerationRequest = {
  prompt: string;
  aspectRatio: AspectRatio;
  /** Publicly fetchable (e.g. signed) URL of the optional starting frame. */
  imageUrl?: string;
};

export type GenerationState =
  | { status: "queued" | "processing" }
  | { status: "completed"; videoUrl: string }
  | { status: "failed"; error: string };

/**
 * Minimal contract every video model integration implements. Adding a new
 * provider (Runway, Kling, Veo, …) means adding one file that satisfies this.
 */
export interface VideoProvider {
  readonly name: string;
  createGeneration(req: GenerationRequest): Promise<{ jobId: string }>;
  getGeneration(jobId: string): Promise<GenerationState>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
