# OpsKings Support Video

This folder contains an automated capture + Remotion pipeline for producing a real UI demo video.

## Setup

```bash
pnpm -C video i
```

## One-command render

```bash
pnpm -C video make
```

This will:
1) Start `pnpm zero:cache` + `pnpm dev` in the repo root
2) Capture UI clips with Playwright (headed, humanized cursor)
3) Render the Remotion composition to `video/out/video.mp4`

## Useful scripts

- `pnpm -C video capture` — capture clips only
- `pnpm -C video render` — render using existing captures
- `pnpm -C video studio` — open Remotion Studio
- `pnpm -C video clean` — remove captures/out/cache

## Environment variables

- `VIDEO_BASE_URL` — defaults to `http://localhost:3000`
- `VIDEO_SKIP_SERVER=1` — skip starting Next.js (assume it’s running)
- `VIDEO_SKIP_ZERO=1` — skip starting `zero:cache`

## Assets

- `video/public/logo-full.png` is copied from the app root when capturing
- Captured clips are written to `video/public/captures/*.webm`
- Manifest is written to `video/public/captures/manifest.json`
