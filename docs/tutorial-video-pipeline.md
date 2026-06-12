# Tutorial Video Generation Pipeline

Automated pipeline that generates screen-capture-style walkthrough videos for
every tutorial on `/app/tutorials`, using Higgsfield image-to-video generation
seeded with real screenshots of the running app.

## Architecture

- **Queue / source of truth:** `public.tutorials` (see
  `supabase/migrations/20260612030000_create_tutorials_table.sql`). One row per
  tutorial. `video_status` drives the queue:
  `pending → generating → completed | failed`.
- **Frontend:** `src/routes/app.tutorials.tsx` fetches
  `id, youtube_id, video_url, video_thumbnail_url, video_status` from the table
  and merges it over the static `TUTORIALS` catalog. Rows with
  `video_status = 'completed'` and a `video_url` render an MP4 `<video>` player;
  rows with a `youtube_id` fall back to a YouTube embed; everything else shows
  "Coming Soon".
- **Writes** to the table go through the service role only (RLS: public
  `select`, no write policies).

## Per-tutorial generation flow

1. Pick the next row: `select * from tutorials where video_status = 'pending' order by featured desc, sort_order limit 1`.
2. Open the page at `app_path` in the running app and screenshot it at
   1280×720 (16:9). See "Capturing real screens" below.
3. Upload the screenshot to Higgsfield (`media_upload` → PUT → `media_confirm`).
4. Set `video_status = 'generating'`, record `video_model`/`video_provider`.
5. Generate with `generate_video`, model `veo3_1_lite` (1 credit/second,
   720p, `generate_audio: false`), `start_image` = uploaded screenshot,
   prompt = flat 2D screen-capture style, cursor movement/hovers/clicks over
   the actual UI, one short on-screen caption, no camera motion or cinematic
   effects.
6. Record the returned job id in `video_job_id`; when the job completes, save
   `results.rawUrl` → `video_url`, `results.thumbnailUrl` →
   `video_thumbnail_url`, set `video_status = 'completed'` and
   `video_generated_at = now()`. On failure set `video_status = 'failed'` and
   `video_error`.
7. Repeat until no `pending` rows remain or credits run out. The queue is
   fully resumable — state lives in the table, never in the session.

## Capturing real screens

- Dev server: `bun run dev -- --host 127.0.0.1 --port 8080` (IPv6 is not
  available in the sandbox; the default `::` bind fails).
- Auth: create a confirmed user via the Supabase admin API
  (`POST {SUPABASE_URL}/auth/v1/admin/users` with the service-role key from
  `.env.development`), then set `profiles.onboarding_complete = true` and a
  presentable `full_name` (it appears in the dashboard greeting).
- Headless capture (Playwright + Chromium):
  - `ignoreHTTPSErrors: true` (sandbox TLS-intercepting proxy).
  - Pre-set `localStorage["nova-rail-open"] = "0"` via `addInitScript` so the
    Nova AI rail does not cover the page.
  - Sign in through `/auth/sign-in`, then navigate **client-side by clicking
    sidebar links** — full-page `goto` loses the session (it lives in
    localStorage, which SSR `beforeLoad` cannot see) and redirects to sign-in.

## Status (2026-06-12)

- 25 tutorials seeded; `welcome` completed (8 s, veo3_1_lite, job
  `96d8a9b5-daf1-4d9b-8796-2f3e97582384`); 24 pending — generation paused on
  credit exhaustion (free plan, 10 credits; each 8 s video costs 8).
- Known issue: the `welcome` caption renders "opering" instead of
  "operating" (AI text artifact). Regenerate when credits allow, or prefer
  shorter caption words in prompts (e.g. "Welcome to Nova").
- Some seeded `app_path` values point at routes no longer present in the
  current sidebar (e.g. `/app/dashboard`, `/app/nova/crm`). They still render
  when visited; revisit the mapping if the IA settles elsewhere.
