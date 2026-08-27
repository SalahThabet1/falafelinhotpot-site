# Agent Notes

Before making architectural, MCP, SEO, UI/UX, dependency, or route changes, read `PRODUCT.md` for product context and `DESIGN.md` for the design system.

## Brand (READ FIRST for any visual/UI work)

- `docs/BRAND-HANDOFF.md` - single source of truth for FIH brand identity, tokens, art direction, and the maintenance contract
- `DESIGN.md` - machine-readable design system (Google Stitch format: tokens + six sections). Replaces the legacy design.md and design.json files
- `src/styles/global.css` - canonical implemented tokens. Use CSS variables, NEVER raw hex. NEVER redeclare a token after its `@theme` block (the cinnabar `#9B1B15` override incident is a cautionary tale)

Rules that are non-negotiable: no pure black/white, no emoji in UI, `mix-blend-mode: multiply` for dark text on paper, light mode only, reduced-motion respected, one crimson accent per page, gold decorative only. Two claims from the old docs are FALSE and must not be re-added: "sharp corners everywhere" (the radius tokens `--radius-sm/lg` are non-zero and used) and "textures not hex backgrounds" (paper texture is optional — the homepage hero is flat `--color-clay`). If the brand docs and code disagree, the code ships - fix the drift in BOTH.

Use the installed skills when relevant:

- `impeccable` for UI/UX design and product-interface work (incl. `/impeccable document` to regenerate `DESIGN.md` from the code)
- `seo`, `seo-audit`, or `programmatic-seo` for public content and search strategy
- `accessibility` or `web-design-guidelines` before shipping interactive UI
- `understand-figma` when inspecting Figma files (the `figma-use`/`figma-create-new-file`/`figma-generate-library` skills are NOT installed)
