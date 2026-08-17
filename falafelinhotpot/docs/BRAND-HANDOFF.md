# FIH Brand Handoff

> Falafel in Hotpot - Brand Identity & Art Direction. Single source of truth for the Modern Heritage v2 system.
> Read this before ANY design, UI, or visual change. Master visual document: `01_brand/handoff/FIH-Brand-Handoff.html` (exportable to PDF, 14 pages A4).
> Canonical implementation: `src/styles/global.css` (tokens) + `design.md` (implementation guide). If this file and the code disagree, the CODE is what ships - fix the drift in both.

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
| `--color-text` | `#1C1C1C` | Body / headlines (espresso) |
| `--color-text-muted` | `#4F4744` | Secondary text |
| `--color-text-faint` | `#766B65` | Meta, labels |
| `--color-text-inverse` | `#FBF7ED` | Text on dark |
| `--color-accent` | `#C0392B` | CTAs, links, drop caps, pull quotes (crimson) |
| `--color-cinnabar` | `#9B1B15` | Eyebrows, seals, primary buttons. DO NOT confuse with accent. |
| `--color-gold` | `#C39A3C` | Ornament, highlights, Arabic accents |
| `--color-dark` | `#261B1C` | Dark bands, footer (plum) |
| `--color-plum` | `#4B2639` | Nested dark surfaces |
| `--border` / `--divider` | `rgba(28,28,28,.12)` / `.16` | Hairs, dividers |

Never invent colors. One accent per page: crimson. Gold is decorative only.

## Typography (self-hosted via @fontsource in fonts.css)

- Display: Cormorant Garamond 300/400/600 + italics (headlines, hero, pull quotes)
- Body: DM Sans 300/400/500/600 (UI, copy, captions)
- Chinese: Noto Sans SC 400/500 (always pair pinyin below on educational content)
- Arabic: Cairo 400/600/700 (RTL respected, equal visual weight)
- Eyebrow kicker: 11px, DM Sans 500, uppercase, 0.22em tracking, cinnabar
- Mandatory: dark text on Xuan paper uses `mix-blend-mode: multiply` (ink into fiber)

## Art direction

Neo-Chinese Editorial (Xin Zhongshi). Physical metaphors: ink soaking into fibrous paper, carved cinnabar seals, frosted glass over traditional art.

- Backgrounds are TEXTURE not hex: `public/background.png` (Xuan paper, seamless), feTurbulence grain fallback at 5-6% alpha
- Cards: frosted slate - semi-transparent warm white (`rgba(245,236,224,.32)`), `backdrop-blur`, faint inset border `rgba(213,194,165,.5)`, sharp corners
- Song Dynasty lattice motifs on section headers/hero edges
- Red seal: square `#9B1B15` block with Chinese glyph, at card corners / section headings (signature move)

## Components

- Eyebrow kicker: 11px uppercase 0.22em tracking, `--color-cinnabar`, above headlines with bottom margin
- Primary button: solid cinnabar `#9B1B15`, ivory text, radius 0, `px-8 py-3`, hover `#7A1510`, color-only transition (no bounce)
- Content card: frosted slate recipe above, generous `p-8`, serif titles, cinnabar text link at bottom
- Nav: 60px, transparent over paper
- Hero: atmospheric split - left ~60% typography (multiply ink), right ~40% breathing room for visual anchor, floating glass cards near bottom, min 85vh

## Layout & spacing

- Container 1200px (`--container`), side padding 24px (`--container-x`), nav 60px, base rhythm 1.5rem
- Negative space is premium real estate. Bilingual stacks: Arabic below/beside English via flex/grid, RTL respected
- Light mode only by design. Plum dark bands are deliberate full-width statements

## Motion

- Entrance: Ink Wash Reveal (clip-path center-outward)
- Easing: Still Water `cubic-bezier(0.16, 1, 0.3, 1)`, 0.8-1.4s durations, 120ms stagger
- Red seal stamp: `scale: [0.5, 1.15, 1]` spring, 0.4s
- Section dividers: thin ink stroke drawing on scroll (strokeDashoffset)
- Ink particles: canvas drifting system in hero
- Reduced motion: ALL animation collapses to static under `prefers-reduced-motion: reduce`

## Site architecture

Astro 5 + Template base (agent-first). React islands only for forms, tabs, breadcrumbs, FAQ, cards, toasts.
Routes: `/` `/about` `/links` `/subscribe` `/contact` `/archive` `/course`. Edition MDX in `src/content/editions`.
Repo: `02_web/astro_website_all/falafelinhotpot/`. Deploy: Netlify. Internal routes (`/api/agent`, dashboard) stay internal.

## Maintenance contract (hard rules)

1. Use CSS variables, never raw hex in components
2. NEVER redeclare a token after its `@theme` block (real incident: `--color-cinnabar` was silently overridden to `#C0392B` site-wide; the true value is `#9B1B15`)
3. No pure `#FFFFFF` / `#000000`; no default Tailwind shadows without custom color/spread
4. Sharp corners everywhere (`border-radius: 0`)
5. No emoji in UI; icon library glyphs only
6. Backgrounds are texture, not hex
7. Update this doc + `design.md` + `PROJECT.md` when the brand evolves
8. Legacy eras (course-launch `#8B1A1A` palette, email `#0E0906` dark system) are archived, never mixed into current surfaces

## Asset inventory

- `public/logo.svg` - wordmark | `public/favicon.svg` - favicon
- `public/brand/logo-light-no-text.png` - light mark | `public/brand/favicon-{32,192,512}.png`
- `public/background.png` - Xuan paper texture | `public/texture.webp`
- `src/styles/global.css` - tokens | `src/styles/fonts.css` - fonts
- `design.md` - implementation guide
- Handoff master + sources: `01_brand/handoff/` (HTML, PDF, assets, archived source docs)
