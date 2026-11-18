# Frameshift — AI video studio

Turn a text prompt (and optionally a starting image) into a short AI-generated video, in landscape **16:9** or portrait **9:16**. Every render goes into a private, per-user library where it can be watched, downloaded as MP4, or deleted.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth, Postgres, Storage) · Luma Dream Machine or fal.ai (swappable)

---

## Features

| Area | What's included |
| --- | --- |
| **Auth** | Email sign-up with confirmation, login, sign-out, forgot/reset password, protected routes |
| **Generation** | Prompt with example ideas, drag/drop/paste image upload, 16:9 / 9:16 picker, `⌘/Ctrl + Enter` to generate |
| **Progress** | Live status (queued → rendering → saving), elapsed timer, estimated progress, toast on completion or failure, background tabs keep tracking |
| **Library** | Masonry grid, hover-to-preview, full-screen viewer, MP4 download with readable filenames, delete with confirmation, format filter |
| **Resilience** | Friendly error messages, stale-job timeout (30 min), 3 concurrent generations per user, provider outages don't leave broken entries |

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard) and copy the **Project URL**, the **publishable (anon) key** and the **secret (service-role) key** into `.env.local`. The secret key stays on the server.
2. Apply the schema — either paste `supabase/migrations/20261118000000_init.sql` into the SQL editor, or with the CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
   This creates the `videos` table with row-level security plus two private storage buckets (`inputs`, `videos`) scoped per user. Run both migration files, in order.
3. In **Authentication → URL Configuration**, set **Site URL** to your app URL and add `http://localhost:3001/auth/confirm` (and your production `/auth/confirm`) to **Redirect URLs**.

### 3. Choose a video provider

- **Mock (default without a key):** simulates a ~20s render and returns a CC0 sample clip — great for UI work. Put the word `fail` in a prompt to test the error path.
- **Luma:** set `LUMA_API_KEY` (from [lumalabs.ai/dream-machine/api](https://lumalabs.ai/dream-machine/api/keys)). Optional `LUMA_MODEL=ray-flash-2` for faster, cheaper renders.
- **fal.ai:** set `FAL_KEY` (from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)). Defaults to Kling 2.5 Turbo Pro. Change `FAL_TEXT_MODEL` / `FAL_IMAGE_MODEL` to use any fal video model that takes `prompt` (+ `image_url`) and returns `{ video: { url } }`, for example:

  | Model | Text-to-video | Image-to-video |
  | --- | --- | --- |
  | Kling 2.5 Turbo Pro (default) | `fal-ai/kling-video/v2.5-turbo/pro/text-to-video` | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` |
  | Veo 3.1 Fast | `fal-ai/veo3.1/fast` | `fal-ai/veo3.1/fast/image-to-video` |
  | Seedance 1.0 Pro | `fal-ai/bytedance/seedance/v1/pro/text-to-video` | `fal-ai/bytedance/seedance/v1/pro/image-to-video` |

  Check each model's page on fal for current pricing and inputs. Kling's image-to-video ignores `aspect_ratio` and follows the shape of the uploaded image.

If more than one key is set, `VIDEO_PROVIDER` picks which one runs new jobs (`luma`, `fal` or `mock`). Jobs already in progress keep using the provider that started them.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3001. The app is pinned to port 3001 so it never collides with other local projects on 3000; auth email links use `NEXT_PUBLIC_SITE_URL`, so keep that in sync if you change the port.

## How it works

```
Browser ──upload image──▶ Supabase Storage (inputs/<uid>/…)
   │
   ├─ POST /api/videos ──▶ insert row (queued) ──▶ provider.createGeneration()
   │
   ├─ GET /api/videos/:id  (polled every 3s while pending)
   │      └─ syncVideo(): asks provider for status
   │             └─ on completion: copies MP4 into Storage (videos/<uid>/<id>.mp4)
   │
   └─ GET /api/videos/:id/download ──▶ 60s signed URL with Content-Disposition
```

- **No webhooks or background workers needed.** Status is pulled on demand by the clients that care about it, so it works on any serverless host. Polling pauses while the tab is hidden.
- **Security:** users can only *read* their own rows and files (enforced by RLS and Storage policies) and upload their own input images. Every write to `videos` rows and generated files happens in a route handler that first verifies the user, then uses the service-role client with the query scoped to that user. This stops users from editing status or video URLs through the public API. Media is served via short-lived signed URLs.
- **Videos are copied into your storage** when they finish, so links never expire with the provider. If the copy fails, the provider URL is kept as a fallback.

### Adding another model

Implement the `VideoProvider` interface in `src/lib/providers/` (two methods: `createGeneration` and `getGeneration`) and register it in `src/lib/providers/index.ts`. Each row records which provider created it, so you can switch providers without breaking in-flight jobs.

## Project structure

```
src/
  app/
    (auth)/          login, signup, forgot-password, reset-password + server actions
    (app)/           authenticated shell: /create, /library
    api/videos/      create, list, status, delete, download
    auth/confirm/    email link handler (PKCE code + token_hash)
  components/
    create/          studio, stage, aspect picker, image dropzone
    library/         grid, viewer, delete confirmation
    video/           shared thumbnail, status badge, timer
    ui/              button, input, dialog, logo
  hooks/use-videos.ts  list state + polling for pending videos
  lib/
    providers/       Luma, fal.ai and mock implementations
    supabase/        browser, server and proxy clients
    videos.ts        status sync, signed URLs, DTO mapping
  proxy.ts           session refresh + optimistic route guards
supabase/migrations/ schema, RLS, storage buckets & policies
```

## Deploying

Deploy to Vercel (or any Node host), set the same env vars, and set `NEXT_PUBLIC_SITE_URL` to the production URL. Add the production `/auth/confirm` URL to Supabase's redirect allow-list. For production email volume, configure custom SMTP in Supabase.
