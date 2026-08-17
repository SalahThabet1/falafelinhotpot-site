# Agent Notes

Before making architectural, MCP, SEO, UI/UX, dependency, or route changes, read `PROJECT.md`.

After completing such changes, update `PROJECT.md` with:

- what changed
- verification status
- new blockers or decisions
- next recommended step

## Brand (READ FIRST for any visual/UI work)

- `docs/BRAND-HANDOFF.md` - single source of truth for FIH brand identity, tokens, art direction, and the maintenance contract
- `design.json` - machine-readable design system (colors, type, components, motion)
- `design.md` - implementation guide (Neo-Chinese Editorial, texture, component recipes)
- `src/styles/global.css` - canonical implemented tokens. Use CSS variables, NEVER raw hex. NEVER redeclare a token after its `@theme` block (the cinnabar `#9B1B15` override incident is a cautionary tale)

Rules that are non-negotiable: no pure black/white, sharp corners, no emoji in UI, textures not hex backgrounds, `mix-blend-mode: multiply` for dark text on paper, light mode only, reduced-motion respected. If the brand docs and code disagree, the code ships - fix the drift in BOTH.

Use the installed skills when relevant:

- `impeccable` for UI/UX design and product-interface work
- `seo`, `seo-audit`, or `programmatic-seo` for public content and search strategy
- `accessibility` or `web-design-guidelines` before shipping interactive UI
- `figma-use` / `figma-create-new-file` / `figma-generate-library` (production profile) when syncing designs to Figma
