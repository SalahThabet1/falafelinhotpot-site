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

`npm run build` requires `public/mandarin-starterkit-course/` — a vendored build of the Mandarin Starter Kit landing page, committed to the repo. No rebuild step needed; treat it as read-only.

## npm Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Astro dev server |
| `npm run build` | Production build (requires the vendored landing course) |
| `npm run preview` | Preview the production build |
| `npm run check` | Quality gate: ESLint + Prettier + `astro check` |
| `npm run lint` / `lint:fix` | ESLint over the repo (no autofix / with) |
| `npm run format` / `format:check` | Prettier write / verify |

(`prebuild` runs `test -f public/mandarin-starterkit-course/index.html` implicitly before every build.)

## Content Model — Editions

The newsletter archive lives in `src/content/editions/*.mdx`, one file per edition. Two tracks:

| Track | `category` | `series` | Current range |
| --- | --- | --- | --- |
| Bridge (cultural) | `Bridge` | `cultural` | `cultural-01` … `cultural-18` |
| Learn (学 Series) | `Learn` | `learn` | `thursday-lesson-01` … `thursday-lesson-14` |

**To add an edition:**
1. Copy an existing `.mdx` as a template. Filename = the URL slug, e.g. `cultural-19-your-slug-here.mdx` → `/editions/cultural-19-your-slug-here`.
2. Set frontmatter fields: `publishDate`, `title`, `titleAr` (Bridge only), `excerpt` (first substantive line, ≤160 chars), `category`, `series`, `issueNumber` (next in the track), `subjectLine`, `bilingual` (Bridge: `true`), `tags`, `metadata.title` (`Bridge #N: … | Falafel in Hotpot`), `metadata.canonical`.
3. Add a card/hero image: `src/assets/images/newsletters/{cultural|thursday-lesson}/<slug>-default.jpg` (16:9, ~1200×675), referenced by frontmatter `image:`. Any size works — `object-fit: cover` crops it.
4. Body: `##` headings for sections; phrase cards use `<LanguageExample lang="chinese" phrase={…} transliteration={…} gloss={…} />`; inline CJK → `<Zh>…</Zh>`, pinyin → `<Py>…</Py>`; standalone quotes → `<PullQuote>…</PullQuote>`; in-article images → `<EditionFigure src={Fig1} alt="…"/>` with a `~/assets/…` import; end Bridge editions with `<EditionCTA …/>`. Learn pages get the course CTA automatically.
5. `npm run check && npm run build`, then commit.

## Environment Variables

Copy `.env.example` to `.env`. See it for per-variable comments.

| Variable | Used by |
| --- | --- |
| `SITE_URL` | SEO / sitemap / canonical URLs |
| `SITE_NAME`, `SITE_DESCRIPTION`, `SITE_AUTHOR` | Global site metadata (`src/config/site.ts`) |
| `PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 (no-ops when unset) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access for the PDF |
| `BLOB_BUSINESS_CHINESE_PATHNAME` | Blob pathname of the PDF |
| `DOWNLOAD_JWT_SECRET` | JWT signing for manual download links |

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
| `/mandarin-starterkit-course/` | Vendored landing page |
| `/api/download/business-chinese` | PDF download endpoint (serverless, `api/download/business-chinese.ts`) |

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
docs/             Brand handoff (BRAND-HANDOFF.md)
DESIGN.md         Machine-readable design system (Stitch format)
PRODUCT.md        Product context & principles
AGENTS.md         Agent instructions — read before UI/architecture/SEO changes
```

## Operations

- **Rotating the business-Chinese PDF**: upload the new file to Vercel Blob (`BLOB_READ_WRITE_TOKEN`, pathname from `BLOB_BUSINESS_CHINESE_PATHNAME`). The download endpoint presigns a short-lived URL after JWT verification. Do this via the Vercel dashboard or `vercel blob put` (CLI), no code change needed.
- **Issuing download links (manual)**: sign a HS256 JWT `{ sub: <email>, email: <email> }` with `DOWNLOAD_JWT_SECRET` (24h TTL, see `lib/business-chinese-download.ts`) using any JWT tool, then send the recipient `/download/business-chinese?token=<jwt>`.
- **ActiveCampaign**: newsletter signups (`/subscribe`) only. Edition content is authored directly in `src/content/editions/` — there is no import pipeline and no webhook.

## External Services

- **Vercel** — hosting + Blob storage
- **ActiveCampaign** — newsletter signups
- **YouTube** — embedded via `VideoCard`
- **Google Analytics** — optional, gated on `PUBLIC_GA_MEASUREMENT_ID`

Note: `src/pages/get-your-chinese-business-guide.astro` contains ~1450 lines of vendored ActiveCampaign embed code (a live conversion page) — treat it as read-only.

## Deploy

Vercel. GitHub Actions (`.github/workflows/vercel-deploy.yml` at the **repo root**, one level above this directory) runs `verify` (install → `npm run check` → `npm run build`, scoped to `falafelinhotpot/`) and only then deploys `vercel deploy --prod` on pushes to `main`. Set the env vars above in the Vercel project settings; the Vercel project's Root Directory must be `falafelinhotpot`.

## Docs

Brand + design system: `docs/BRAND-HANDOFF.md` and `DESIGN.md`. Product context: `PRODUCT.md`. Security posture: `SECURITY.md`. Agent instructions (read before UI/architecture/SEO changes): `AGENTS.md`.
