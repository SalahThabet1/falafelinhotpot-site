# Falafel in Hotpot

China–Arab cultural intelligence journal and Mandarin learning site. Astro + React islands + MDX content, deployed on Vercel.

Live site: <https://falafelinhotpot.com>

## Stack

- **Astro 5** static site with React islands (`@astrojs/react`)
- **Tailwind CSS v4** via `@tailwindcss/vite`, custom design tokens in `src/styles/global.css` (`@theme` is the canonical token source)
- **MDX** content collections (`src/content/editions`) for the newsletter archive
- **astro-icon** (Lucide, Simple Icons, Tabler) — no raw inline SVGs
- **Vercel Blob** for the business-Chinese PDF download (JWT-gated)

## Quick Start

```bash
npm install
npm run dev        # http://localhost:4321
```

Requires `public/mandarin-starterkit-course/` for `npm run build` — see
`sync:mandarin-landing` below, or run the sync first:

```bash
npm run sync:mandarin-landing
```

## npm Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Astro dev server |
| `npm run build` | Production build (requires the vendored landing course) |
| `npm run preview` | Preview the production build |
| `npm run check` | Quality gate: ESLint + Prettier + `astro check` |
| `npm run lint` / `lint:fix` | ESLint over the repo (no autofix / with) |
| `npm run format` / `format:check` | Prettier write / verify |
| `npm run import:editions` | Import newsletter MDX from ActiveCampaign exports (`CULTURAL_SRC`/`EDU_SRC`) |
| `npm run sync:edu-images` | `import:editions` with image sync |
| `npm run sync:mandarin-landing` | Rebuild `../../landing-main` and copy its dist into `public/mandarin-starterkit-course/` |
| `npm run upload:business-chinese-pdf` | Upload the business-Chinese PDF to Vercel Blob |
| `npm run generate:download-token` | Mint a one-time download JWT |

(`prebuild` runs `test -f public/mandarin-starterkit-course/index.html` implicitly before every build.)

## Environment Variables

Copy `.env.example` to `.env`. See it for per-variable comments.

| Variable | Used by |
| --- | --- |
| `SITE_URL` | SEO / sitemap / canonical URLs |
| `SITE_NAME`, `SITE_DESCRIPTION`, `SITE_AUTHOR` | Global site metadata (`src/config/site.ts`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access for the PDF |
| `BLOB_BUSINESS_CHINESE_PATHNAME` | Blob pathname of the PDF |
| `DOWNLOAD_JWT_SECRET` | JWT signing for `/api/download/issue-token` |
| `DOWNLOAD_WEBHOOK_SECRET` | Shared secret for the ActiveCampaign token-minting webhook |
| `CULTURAL_SRC`, `EDU_SRC`, `OUT_DIR` | `import:editions` script paths |

## Routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/editions` · `/editions/[slug]` | Newsletter archive + article pages |
| `/category/[category]/[...page]` | Edition category pagination |
| `/pinyin-chart` | Interactive Pinyin chart (React island) |
| `/get-your-chinese-business-guide` | Business-Chinese guide download page |
| `/download/business-chinese` | JWT-gated PDF download endpoint (rewritten to the API) |
| `/subscribe` | Newsletter signup |
| `/403` `/404` `/500` | Error pages |
| `/mandarin-starterkit-course/` | Vendored landing page (built from `landing-main`) |
| `/api/download/business-chinese` | PDF download endpoint (serverless, `api/download/business-chinese.ts`) |
| `/api/download/issue-token` | JWT issue endpoint (serverless, `api/download/issue-token.ts`) |

### Redirects (in `vercel.json`)

`/newsletter` → `/subscribe` · `/archive`, `/archive/*`, `/blog`, `/blog/*` → `/editions` · `/links` → `/` · `/mandarin-starterkit-course` → `/mandarin-starterkit-course/` · `/courses/7-day-mandarin` → `/mandarin-starterkit-course/`

## Directory Guide

```
src/
  components/     Astro + React components (fih/, editions/, common/, islands/, pinyin/)
  config/         Site metadata (site.ts)
  content/        MDX content collections (editions/)
  layouts/        Page layouts
  pages/          Route definitions (see map above)
  styles/         global.css — design tokens & base styles; fonts.css — @fontsource imports
  utils/          Shared helpers (analytics, permalinks, blog, ...)
api/              Vercel serverless functions (outside src/)
lib/              Shared server code (business-chinese-download JWT lib)
public/           Static assets incl. audio/, images/, mandarin-starterkit-course/ build
scripts/          Node/tsx tooling (edition import, PDF upload, token mint)
docs/             Brand handoff (BRAND-HANDOFF.md)
DESIGN.md         Machine-readable design system (Stitch format)
PRODUCT.md        Product context & principles
```

## External Services

- **ActiveCampaign** — newsletter signups (`/subscribe`) and edition exports; the `import:editions` script consumes its HTML exports
- **Vercel Blob** — hosts the business-Chinese guide PDF
- **YouTube** — embedded via `VideoCard`
- **Sibling `landing-main`** — the Mandarin Starter Kit landing page lives in `../../landing-main`; `sync:mandarin-landing` builds it and vendors `dist/` into `public/mandarin-starterkit-course/`

Note: `src/pages/get-your-chinese-business-guide.astro` contains ~1450 lines of vendored ActiveCampaign embed code (a live conversion page) — treat it as read-only.

## Deploy

Vercel. GitHub Actions (`.github/workflows/vercel-deploy.yml` at the **repo root**, one level above this directory) runs `verify` (install → `npm run check` → `npm run build`, scoped to `falafelinhotpot/`) and only then deploys `vercel deploy --prod` on pushes to `main`. Set the env vars above in the Vercel project settings; the Vercel project's Root Directory must be `falafelinhotpot`.

## Docs

Brand + design system: `docs/BRAND-HANDOFF.md` and `DESIGN.md`. Product context: `PRODUCT.md`. Agent instructions: `AGENTS.md`.
