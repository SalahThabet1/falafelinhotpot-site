# FIH Asset Migration Manifest

Source: `/home/salah/falafelinhotpot/02_web/site/public`

## Public FIH Assets

- `/logo.svg`, `/logo.png`, `/logo-nav.png`, `/favicon.svg`, `/favicon.png`, `/apple-touch-icon.png`
  - copied to `public/` with the same paths.
- `/ink-particles.gif`, `/ink-splash.gif`, `/ink-splash-pulse.gif`, `/ink-splash-static.png`
  - copied to `public/` with the same paths.
- `/nl_culture.png`, `/nl_edu1.png`, `/nl_edu2.png`, `/video-thumb*.jpg`
  - copied to `public/` with the same paths.
- `/open-design/**`
  - copied to `public/open-design/**` with the same paths for homepage imagery, brand photos, and synced CSS.
- `/images/editions/**`
  - copied to `public/images/editions/**` with the same paths.
- `/images/newsletters/**`
  - copied to `public/images/newsletters/**` with the same paths so migrated MDX image references remain stable.

## Archived Virex Demo Assets

The following Virex demo-only public folders were moved out of `public/` so they remain recoverable but are not emitted:

- `public/images/blog` -> `src/_virex-demo/public/images/blog`
- `public/images/features` -> `src/_virex-demo/public/images/features`
- `public/images/integrations` -> `src/_virex-demo/public/images/integrations`
- `public/images/logos` -> `src/_virex-demo/public/images/logos`
- `public/images/payments` -> `src/_virex-demo/public/images/payments`
- `public/images/team` -> `src/_virex-demo/public/images/team`
- `public/images/testimonials` -> `src/_virex-demo/public/images/testimonials`
