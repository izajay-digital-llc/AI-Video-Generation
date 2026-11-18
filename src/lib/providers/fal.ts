import "server-only";
import { ProviderError, type GenerationRequest, type GenerationState, type VideoProvider } from "./types";

const QUEUE_HOST = "queue.fal.run";

type SubmitResponse = { request_id: string; response_url: string; status_url: string };
type StatusResponse = { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED"; error?: string | null };
type ResultResponse = { video?: { url?: string } | null; detail?: unknown };

/**
 * fal.ai queue API — https://fal.ai/docs/model-apis/model-endpoints/queue
 *
 * Works with any fal video model that takes `prompt` (+ `image_url` for
 * image-to-video) and returns `{ video: { url } }`. Kling, Veo, Seedance, Wan
 * and others follow this shape, so models are swapped through env vars.
 */
export class FalProvider implements VideoProvider {
  readonly name = "fal";

  constructor(
    private readonly apiKey: string,
    private readonly textModel: string,
    private readonly imageModel: string,
  ) {}

  private async call<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
    if (res.ok) return res.json() as Promise<T>;

    const detail = await readDetail(res);
    // fal reports an empty balance as a 403, so check the message before auth.
    if (res.status === 402 || /balance|credit|billing/i.test(detail))
      throw new ProviderError("The video service account is out of credits.", 502);
    if (res.status === 401 || res.status === 403)
      throw new ProviderError("The video service rejected our API key.", 502);
    if (res.status === 429)
      throw new ProviderError("The video service is busy right now. Try again in a minute.", 429);
    if (res.status === 400 || res.status === 422)
      throw new ProviderError(`The video service couldn't accept this request: ${detail}`, 400);
    throw new ProviderError(`Video service error (${res.status}): ${detail}`);
  }

  async createGeneration({ prompt, aspectRatio, imageUrl }: GenerationRequest) {
    const model = imageUrl ? this.imageModel : this.textModel;
    const submitted = await this.call<SubmitResponse>(`https://${QUEUE_HOST}/${model}`, {
      method: "POST",
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        ...(imageUrl && { image_url: imageUrl }),
      }),
    });
    // The result URL identifies the job. fal returns it ready-made because
    // models with sub-paths use a shorter URL that we shouldn't guess.
    return { jobId: assertQueueUrl(submitted.response_url) };
  }

  async getGeneration(jobId: string): Promise<GenerationState> {
    const resultUrl = assertQueueUrl(jobId);
    const status = await this.call<StatusResponse>(`${resultUrl}/status`);

    if (status.status === "IN_QUEUE") return { status: "queued" };
    if (status.status === "IN_PROGRESS") return { status: "processing" };
    if (status.error) return { status: "failed", error: status.error };

    try {
      const result = await this.call<ResultResponse>(resultUrl);
      const url = result.video?.url;
      return url
        ? { status: "completed", videoUrl: url }
        : { status: "failed", error: "Generation finished without a video file." };
    } catch (err) {
      // A finished job whose result is an error (e.g. a content-policy block).
      if (err instanceof ProviderError && err.status === 400) {
        return { status: "failed", error: err.message.replace(/^.*?request: /, "") };
      }
      throw err;
    }
  }
}

/**
 * Job ids are stored in the user's own row, so treat them as untrusted:
 * only ever send our API key to fal's queue host.
 */
function assertQueueUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProviderError("Invalid job reference.", 400);
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== QUEUE_HOST ||
    url.search ||
    !/^\/[\w.-]+\/[\w.-]+\/requests\/[\w-]+$/.test(url.pathname)
  ) {
    throw new ProviderError("Invalid job reference.", 400);
  }
  return url.toString();
}

async function readDetail(res: Response) {
  try {
    const body = await res.json();
    const d = body?.detail ?? body?.message ?? body;
    if (Array.isArray(d)) return d.map((x) => x?.msg ?? JSON.stringify(x)).join("; ");
    return typeof d === "string" ? d : JSON.stringify(d);
  } catch {
    return res.statusText;
  }
}
