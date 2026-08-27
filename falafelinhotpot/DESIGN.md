---
name: Falafel in Hotpot
description: China–Arab cultural intelligence journal and Mandarin learning site — Neo-Chinese Editorial, paper/ink/cinnabar.
colors:
  primary: "#9B1B15"
  primary-deep: "#7A1510"
  accent: "#C0392B"
  ink: "#2C2C2A"
  ink-muted: "#4A4A48"
  gold: "#C39A3C"
  dark-plum: "#261B1C"
  plum: "#4B2639"
  neutral-bg: "#FBF7ED"
  neutral-surface: "#FDF9F1"
  neutral-surface-2: "#F4EADC"
  neutral-clay: "#EDDCC6"
  xuan-50: "#FBF9F6"
  xuan-100: "#F5ECE0"
  xuan-200: "#EEDBB6"
  xuan-300: "#D5C2A5"
typography:
  display:
    fontFamily: "Playfair Display, Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.2vw, 1.125rem)"
    lineHeight: 1.7
  chinese:
    fontFamily: "Noto Sans SC, sans-serif"
  arabic:
    fontFamily: "Cairo, Noto Kufi Arabic, sans-serif"
  label:
    fontSize: "0.68rem"
    fontWeight: 600
    letterSpacing: "0.22em"
    textTransform: "uppercase"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "1rem"
spacing:
  section: "6rem"
  content: "2rem"
  container: "1200px"
  container-x: "24px"
  nav: "60px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "0"
    padding: "12px 28px"
    border: "1.5px solid {colors.primary}"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "12px 28px"
    border: "1.5px solid rgba(44,44,42,0.3)"
  eyebrow-kicker:
    textColor: "{colors.primary}"
    typography: "{typography.label}"
  focus-ring:
    border: "2px solid {colors.primary}"
---

# DESIGN.md

## 1. Overview: The Paper Bridge

Falafel in Hotpot is a trilingual China–Arab cultural journal and Mandarin learning brand. "Two civilisations. One intersection." The visual system is **Neo-Chinese Editorial**: physical print metaphors — ink soaking into fibrous paper, carved cinnabar seals, warm parchment surfaces. Every page is light mode, textured or warm-toned, and typography-led. The multilingual identity (Arabic, Chinese, pinyin, English) is the product, not decoration.

The system is deliberately restrained: one accent (crimson `#C0392B`) per page, gold reserved for ornament, no pure black/white, no emoji, no heavy motion. Dark ink text over paper uses `mix-blend-mode: multiply` to read like ink in fiber. Reduced-motion collapses every animation.

## 2. Colors: The Parchment–Cinnabar Palette

The palette is warm-neutral surfaces (parchment, clay, card) with a deep cinnabar primary and a crimson accent. Text is warm ink, never pure black.

- **Primary `#9B1B15` (cinnabar)** — eyebrows, seals, primary buttons, links in prose, form submits. Hover deepens to `#7A1510`.
- **Accent `#C0392B` (crimson)** — CTAs, links, drop caps, pull quotes. One accent per page.
- **Gold `#C39A3C`** — ornament only, Arabic accents, decorative highlights.
- **Ink `#2C2C2A` / muted `#4A4A48`** — body and secondary text. Dark text over paper renders with `mix-blend-mode: multiply`.
- **Dark `#261B1C` / plum `#4B2639`** — deliberate full-width dark bands (footer) and nested dark surfaces. Light mode elsewhere.
- **Neutrals** — parchment `#FBF7ED` (page bg), card `#FDF9F1` (surfaces), surface-2 `#F4EADC` (raised), clay `#EDDCC6` (section alternates).
- **Xuan ramp** — `#FBF9F6 / #F5ECE0 / #EEDBB6 / #D5C2A5` (paper fallbacks, card borders).
- **Borders** — `rgba(28,28,28,0.12)` hair / `rgba(28,28,28,0.16)` divider (not hex; declared as CSS vars).

Canonical source: `src/styles/global.css`. `@theme` is authoritative — do not redeclare a token after it (the cinnabar `#9B1B15` override incident). Use CSS variables, never raw hex in components.

## 3. Typography

- **Display serif** — `Playfair Display` / `Cormorant Garamond`, weights 400/600/700 (+ italics). Headlines, hero, pull quotes. Weights loaded: Cormorant Garamond 400/600/700 + 400/600 italic; Playfair Display 400/600/700 + 400 italic.
- **Body sans** — `DM Sans` 400/500/600 (+ 400 italic). UI, copy, captions. Note: the bare `body` base in `src/styles/global.css` falls back to `system-ui`; DM Sans is applied via `--font-body` at the component level.
- **Chinese** — `Noto Sans SC` 400/500/700. Always pair pinyin below on educational content.
- **Arabic** — `Cairo` 400/600/700 and `Noto Kufi Arabic` 400/500/600/700. RTL respected, equal visual weight.
- **Type scale** (CSS vars) — `--text-hero clamp(3rem,7vw,6rem)`, `--text-3xl clamp(2.75rem,6vw,5rem)`, `--text-xl clamp(2rem,4vw,3rem)`, `--text-lg clamp(1.5rem,2.8vw,2rem)`, `--text-base clamp(1rem,1.2vw,1.125rem)`. `h1` defaults to display serif 600, line-height 1.1.
- **Eyebrow kicker** (`.label`) — 0.68rem, 600, uppercase, `0.22em` tracking, cinnabar, `mix-blend-mode: multiply`.

## 4. Elevation: Flat & Tonal

No shadow vocabulary. Depth is expressed by **surface toning** — stacking `--color-surface-2` → `--color-card` → `--color-parchment`, hair borders, and 0-radius containers. The only shadow is the isolated editorial-form submit button's hover lift; the rest of the system is flat. Sharp corners are *not* a rule: `--radius-sm/lg` (0.375/0.5/1rem) exist and are used on code, pre, images, and focus states.

## 5. Components

- **Primary button** (`.btn--primary`, editorial submit) — solid cinnabar `#9B1B15`, parchment text, 1.5px self-border, radius 0 (form submit: 2px), generous padding. Hover `#7A1510`, color-only transition (no bounce).
- **Secondary / ghost** (`.btn--secondary`, `.btn--ghost`) — transparent, ink text, `rgba(44,44,42,0.3)` border; hover swaps border+text to cinnabar.
- **Eyebrow kicker** — see Typography. Above headlines, cinnabar, multiply ink.
- **Newsletter form** — underline-style inputs (`border-bottom`, no side borders), accent submit, 44px min touch height. Editorial variant: cinnabar full-width submit, radius 2px.
- **Nav** — fixed 60px, parchment translucency + blur, cinnabar logo and CTA.
- **Focus ring** — 2px solid primary outline, offset 2px, on `:focus-visible` (links, buttons, inputs).

## 6. Do's and Don'ts

**Do**
- Use CSS variables from `src/styles/global.css` — never raw hex in components.
- Render dark text over paper with `mix-blend-mode: multiply`.
- Light mode only, with deliberate plum/dark full-width bands as statements.
- Keep motion minimal and honor `prefers-reduced-motion` (collapse to static).
- Respect `@theme` as the single source of truth for tokens.
- Let the trilingual typography carry the experience; one crimson accent per page.

**Don't**
- Use pure `#FFFFFF` / `#000000`, or default Tailwind shadows without custom color and spread.
- Redeclare a design token after the `@theme` block — the later value silently wins site-wide.
- Use emoji in UI; icon-library glyphs only.
- Reach for glassmorphism, gradient text, or card grids as default patterns — this is editorial, not SaaS.
- Ship motion without a reduced-motion fallback.
