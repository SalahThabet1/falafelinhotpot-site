# FIH Brand Handoff

> Falafel in Hotpot - Brand Identity & Art Direction. Single source of truth for the Modern Heritage v2 system.
> Read this before ANY design, UI, or visual change. The design system is also machine-readable in `DESIGN.md` (Google Stitch format).
> Canonical implementation: `src/styles/global.css` (tokens) + `DESIGN.md`. If this file and the code disagree, the CODE is what ships - fix the drift in both.

## Brand essence

A China-Arab cultural intelligence journal and Mandarin learning brand. Editorial, tactile, rooted in place.
Tagline: "Two civilisations. One intersection." Voice: warm, precise, cultural, grounded, confident. Trilingual by design: Arabic, Chinese, English. Code-switching is identity, not decoration.

## Color tokens (canonical, from global.css)

| Token | Value | Role |
|-------|-------|------|
| `--color-parchment` | `#FBF7ED` | Page background, hero |
| `--color-clay` | `#EDDCC6` | Section alternate background |
| `--color-card` | `#FDF9F1` | Card / surface |
| `--color-surface-2` | `#F4EADC` | Raised surfaces |
| `--color-ink` | `#2C2C2A` | Body / headlines (espresso; `@theme` wins over the `:root` `#1C1C1C` copy) |
| `--color-ink-light` | `#4A4A48` | Secondary text |
| `--color-text-inverse` | `#FBF7ED` | Text on dark |
| `--color-accent` | `#C0392B` | CTAs, links, drop caps, pull quotes (crimson) |
| `--color-cinnabar` | `#9B1B15` | Eyebrows, seals, primary buttons. DO NOT confuse with accent. |
| `--color-cinnabar-dark` | `#7A1510` | Cinnabar hover |
| `--color-gold` | `#C39A3C` | Ornament, highlights, Arabic accents |
| `--color-dark` | `#261B1C` | Dark bands, footer (plum) |
| `--color-plum` | `#4B2639` | Nested dark surfaces |
| `--border` / `--divider` | `rgba(28,28,28,.12)` / `.16` | Hairs, dividers |

Never invent colors. One accent per page: crimson. Gold is decorative only.

## Typography (self-hosted via @fontsource in src/styles/fonts.css)

- Display: Cormorant Garamond **400/600/700** + 400/600 italic (headlines, hero, pull quotes)
- Display alt: Playfair Display **400/600/700** + 400 italic (loaded; used by `--font-serif-display`/`--font-editorial`)
- Body: DM Sans **400/500/600** + 400 italic (UI, copy, captions; the bare `body` base falls back to `system-ui`)
- Chinese: Noto Sans SC **400/500/700** (always pair pinyin below on educational content)
- Arabic: Cairo **400/600/700** and Noto Kufi Arabic **400/500/600/700** (RTL respected, equal visual weight)
- Eyebrow kicker: 11px, DM Sans 600, uppercase, 0.22em tracking, cinnabar
- Mandatory: dark text on paper uses `mix-blend-mode: multiply` (ink into fiber)

## Art direction

Neo-Chinese Editorial (Xin Zhongshi). Physical metaphors: ink soaking into fibrous paper, carved cinnabar seals. The aesthetic is typography-led and restrained; it does **not** ship the heavier motifs from the original spec.

- Paper texture: `public/background.png` (Xuan paper) is used on the editions index. The homepage hero is **flat** `--color-clay` — texture is optional per-section, not mandatory.
- What is NOT implemented and must not be re-added as if it were: Song Dynasty lattice motifs, frosted-slate glass cards (`rgba(245,236,224,.32)` + `backdrop-blur`), the red-seal stamp, and a canvas ink-particle system — zero code hits.

## Components

- Eyebrow kicker: 11px uppercase 0.22em tracking, `--color-cinnabar`, above headlines with bottom margin, `mix-blend-mode: multiply` over paper
- Primary button: solid cinnabar `#9B1B15`, parchment text, radius 0, `px-8 py-3`, hover `#7A1510`, color-only transition (no bounce)
- Form submit (editorial): cinnabar full-width, radius 2px, 44px min height; newsletter form uses accent `#C0392B`
- Content: generous padding, serif titles, cinnabar text link at bottom; depth via surface toning (no shadow vocabulary)
- Nav: 60px, parchment translucency + blur, cinnabar logo/CTA
- Hero: split grid at `src/pages/index.astro:310` — **image LEFT (42fr), text RIGHT (58fr)** (the older "text left 60% / art right 40%" description was the opposite of the code)

## Layout & spacing

- Container 1200px (`--container`), side padding 24px (`--container-x`, 16px below 600px), nav 60px, base rhythm 1.5rem
- Negative space is premium real estate. Bilingual stacks: Arabic below/beside English via flex/grid, RTL respected
- Light mode only by design. Plum dark bands are deliberate full-width statements

## Motion

There is no site-wide motion system. What exists: the sticky nav shadow transition (one `cubic-bezier(0.16,1,0.3,1)` easing), scroll reveals on home sections, and the pinyin chart's per-tab icon animations. The original spec's ink-wash reveal, spring red-seal stamp, stroke-dashoffset dividers, and canvas particles were never implemented. `prefers-reduced-motion: reduce` collapses all animation to static (`src/styles/global.css`).

## Site architecture

Astro 5 static site + React islands (`@astrojs/react`) + MDX content collections. Tailwind CSS v4 (CSS-first `@theme`, not a `tailwind.config`). Deploy: **Vercel** (Blob for the PDF, GitHub Actions gates then deploys from `falafelinhotpot/`).
Routes: `/` `/subscribe` `/editions` `/category/[...]` `/pinyin-chart` `/get-your-chinese-business-guide` `/mandarin-starterkit-course/` plus error pages. `/links` and `/archive` are permanent redirects (to `/` and `/editions`); `/about`, `/contact`, `/course` do not exist. Edition MDX in `src/content/editions`. Repo: `02_web/astro_website_all/falafelinhotpot/`.

## Maintenance contract (hard rules)

1. Use CSS variables, never raw hex in components
2. NEVER redeclare a token after its `@theme` block (real incident: `--color-cinnabar` was silently overridden to `#C0392B` site-wide; the true value is `#9B1B15`)
3. No pure `#FFFFFF` / `#000000`; no default Tailwind shadows without custom color/spread
4. Radius is fine: `--radius-sm/lg` (0.375/0.5/1rem) are non-zero and used — "sharp corners everywhere" is NOT a rule
5. No emoji in UI; icon library glyphs only
6. Paper texture is optional, not mandatory (homepage hero is flat `--color-clay`)
7. Update this doc + `DESIGN.md` + `PRODUCT.md` when the brand evolves
8. Legacy eras (course-launch `#8B1A1A` palette, email `#0E0906` dark system) are archived, never mixed into current surfaces

## Asset inventory

- `public/logo.svg` - wordmark | `public/favicon.svg` - favicon
- `public/brand/logo-light-no-text.png` - light mark | `public/brand/favicon-{32,192,512}.png`
- `public/background.png` - Xuan paper texture | `public/texture.webp`
- `src/styles/global.css` - tokens | `src/styles/fonts.css` - fonts
- `DESIGN.md` - machine-readable design system (Stitch format)
- The original handoff master + sources live outside this repo (archived) — not part of the checkout
