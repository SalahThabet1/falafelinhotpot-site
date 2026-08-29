# Security

Security posture for the Falafel in Hotpot site (Astro 5, static, Vercel).

## Deployment model

- **Astro 5.18.x, `output: 'static'`.** The site is fully prerendered to HTML at
  build time and served from Vercel's static CDN/edge. There is **no Node
  runtime**, **no SSR adapter** (`@astrojs/node`, etc.), and **no runtime
  `app.render()` request handler** — Vercel serves the prebuilt files directly.
- Serverless functions under `api/` handle the gated business-Chinese PDF
  download (Vercel functions, separate from the Astro runtime).

This model is the reason the Astro advisories below are not exploitable here.

## Known advisories — `astro@5.18.x` (NOT exploitable here)

The installed Astro version carries advisory flags in `npm audit`. All of them
require SSR, server islands, view transitions, or attacker-controlled render
input — none of which this site uses. Verified against `astro.config.mjs`
(`output: 'static'`) and the source (no view transitions, no `server:load`,
no RSS integration, all render input is build-time local data).

| Advisory | Requires | Status here |
| --- | --- | --- |
| define:vars XSS (GHSA-j687-52p2-xcff) | SSR + request data into `define:vars` | not exploitable — static build; `define:vars` carries only env GA id and a numeric status code |
| Server island param replay (GHSA-xr5h-phrj-8vxv) | server islands (`server:load`) | not used |
| Spread-attr XSS ×2 (GHSA-jrpj-wcv7-9fh9 / GHSA-f48w-9m4c-m7f5) | attacker-controlled attribute/prop names | render input is build-time local data |
| View-transition XSS ×2 (GHSA-4g3v-8h47-v7g6 / GHSA-7pw4-f3q4-r2p2) | `transition:*` / `<ViewTransitions>` | not used |
| Slot-name XSS (GHSA-8hv8-536x-4wqp) | attacker-controlled `<slot name>` | only default `<slot />` |
| Host-header SSRF (GHSA-2pvr-wf23-7pc7) | SSR `app.render()` / `@astrojs/node` custom server | Vercel static hosting, no runtime error-page fetch |

Remaining `npm audit` findings are transitive **build-time** tooling
(esbuild, sharp) with no runtime exposure for a static site.

### Hard constraints

- **Do NOT switch to `output: 'server'` or `'hybrid'`, and do NOT add view
  transitions, server islands, or an SSR adapter, without first upgrading
  Astro to a patched release** (≥ 6.4.6). The advisories above become live the
  moment any of those is introduced.
- **Never pass request-derived or user-controlled data into `define:vars`** on
  `<script>` tags. Keep those values to build-time constants (env vars,
  numeric status codes).
- If an upgrade is scheduled: branch it, bump `astro` + `@astrojs/mdx` +
  `@astrojs/react` together, and gate merge on `npm run check`, `astro build`,
  and a visual regression pass over the theme-sensitive pages (home, editions,
  pinyin chart, error pages).

## Secrets

- No secrets are committed. `.env.local` is gitignored and untracked.
- Serverless functions read secrets exclusively from `process.env`
  (`BLOB_READ_WRITE_TOKEN`, `DOWNLOAD_JWT_SECRET`, `SITE_URL`). Only
  `PUBLIC_*` env vars reach the client bundle.
- `.env.example` documents every variable with placeholders.

## HTTP headers (vercel.json)

Applied site-wide: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security` (2y, includeSubDomains, preload),
`Permissions-Policy` (camera/geolocation/microphone/payment/usb disabled).
Hashed assets (`/_astro/`, `/audio/`) are cached immutable; HTML is
`max-age=0, must-revalidate`.

## Download gate (`api/download/*`)

- Tokens are HS256 JWTs (24h TTL) verified on every download request; the blob
  presigned URL is short-lived and never cached (`Cache-Control: no-store`).
  Links are issued manually — signed with `DOWNLOAD_JWT_SECRET` and sent to
  the recipient directly (no public minting endpoint).
- **Open items:** the ActiveCampaign embed on `/get-your-chinese-business-guide`
  uses `eval()` (JSONP) — treat AC as a trusted-third-party boundary until
  replaced. Blob upload keeps `allowOverwrite: true` deliberately (the download
  gate reads a fixed pathname; versioned suffixes would break it).

## Reporting

Privately report vulnerabilities via GitHub security advisories on the repo
(`Security` tab) or email `hello@falafelinhotpot.com`.
