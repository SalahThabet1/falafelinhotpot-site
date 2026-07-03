# Falafel in Hotpot - Global Design System & Implementation Guide

## 1. Core Aesthetic: Neo-Chinese Editorial (Xin Zhongshi)

This project uses a highly tactile, print-inspired aesthetic. It rejects standard digital UI patterns (flat colors, harsh shadows, standard white cards) in favor of physical metaphors: ink soaking into fibrous paper, carved cinnabar seals, and frosted glass laid over traditional artwork.

**Strict Directives for AI Generation:**

- **Never** use pure white (`#FFFFFF`) or pure black (`#000000`).
- **Never** use default Tailwind utility shadows (`shadow-md`, etc.) without customizing the color and spread to match the ambient environment.
- **Always** prioritize negative space. Treat padding and margin as premium real estate.

## 2. Background Architecture

The platform relies on immersive, full-page textured backgrounds rather than solid hex codes.

- **Base Layer:** The global background is a seamless, high-resolution Xuan (rice) paper texture. 
- **Implementation:** Use `src/assets/background.png` as the primary page background with `background-size: cover` or `contain` depending on the container size. Ensure it is optimized via Astro's image tools.

## 3. Strict Color Palette (Tailwind Config)

All styling must strictly adhere to this customized palette. Do not invent new colors.

```javascript
// tailwind.config.mjs extension requirements:
theme: {
  extend: {
    colors: {
      cinnabar: {
        DEFAULT: '#9B1B15', // Matte Forbidden Red (Seals, Buttons, Eyebrows)
        dark: '#7A1510',
      },
      ink: {
        DEFAULT: '#2C2C2A', // Primary Charcoal Ink (Headlines, Body)
        light: '#4A4A48',
      },
      xuan: {
        100: '#F5ECE0', // UI Card highlights
        200: '#EEDBB6', // Base paper tone (for fallbacks)
        300: '#D5C2A5', // Card borders
      }
    }
  }
}
```

## 4. Typography & "Ink" Rendering
The platform requires a flawless bilingual hierarchy (English/Pinyin and Arabic).

Latin Typeface: An elegant, high-contrast Serif (e.g., Playfair Display). Used for English main titles and prominent UI elements.

Arabic Typeface: A contemporary, high-legibility Kufi or Naskh font (e.g., Noto Kufi Arabic). It must carry equal visual weight to the Latin serif.

The Ink Effect (MANDATORY): Any dark text (text-ink) placed directly over the Xuan paper background MUST utilize the CSS property mix-blend-mode: multiply. This simulates physical ink soaking into the paper fibers.

## 5. UI Component Architecture
A. Eyebrow Kickers (The Red Seal)
Used to categorize content (e.g., "LATEST EDITION", "CULTURAL JOURNAL").

Style: Small text (text-xs), uppercase, wide letter-spacing (tracking-widest), colored in text-cinnabar.

Placement: Always placed above main headlines with adequate bottom margin. Apply mix-blend-mode: multiply if on the paper background.

B. Primary Buttons (The Cinnabar Block)
Flat, solid, structurally grounded.

Style: Solid bg-cinnabar, text-white, minimal or no border-radius (rounded-sm), elegant horizontal padding (px-8 py-3).

Interaction: hover:bg-cinnabar-dark transition-colors duration-300. No bounce or pop animations.

C. Content Cards (The Frosted Slate)
Used for article previews, journal links, and modular content. These sit elegantly over the background texture.

Base: Highly translucent warm white (bg-xuan-100/30 or similar).

Glassmorphism: backdrop-blur-md.

Structure: A defining double-border effect or a single faint inset border.

Example approach: border border-xuan-300/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)].

Internal Layout: Generous internal padding (p-8). Serif titles, with a subtle text-cinnabar text link at the bottom (e.g., "Read the latest letter →").

## 6. Layout & Alignment Rules
Stack bilingual text thoughtfully. If an English subtitle exists, the Arabic translation should sit directly below or cleanly beside it using Flexbox or Grid.

Ensure RTL (Right-to-Left) directionality is respected for Arabic text blocks, maintaining correct punctuation alignment.

## 7. Specific Component Architectures

### A. The Hero Section (Atmospheric Split)
The Hero Section introduces the aesthetic and must balance the rich visual background with highly legible typography.
* **The Canvas:** The main wrapper must strictly use `src/assets/background.png` as a full-bleed background (`bg-cover bg-center` or via Astro `<Image>`), spanning at least `min-h-[85vh]`.
* **The Split Grid:** The internal container acts as a split screen using standard CSS Grid or Flexbox.
  * **Left Column (approx. 60%):** Houses all typography (Headline, Subtitle, Eyebrow). This area utilizes the negative space of the background's Xuan paper. All dark text here MUST use `mix-blend-mode: multiply`.
  * **Right Column (approx. 40%):** Serves as the breathing room for the background's visual anchor (e.g., the ink-wash pine). Do not place heavy UI elements here that block the art.
* **Floating Glass UI:** The content cards ("Latest Edition", "The Journal") must sit inside a flex/grid container positioned near the bottom of the section. They should subtly span across the left column, bridging the layout, using the "Frosted Slate" glassmorphism styling defined in Section 5C.
