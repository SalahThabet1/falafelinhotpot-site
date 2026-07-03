# Virex Agentic Astro Project

Last updated: 2026-06-22

This file is the living implementation tracker for turning Virex into a multi-purpose Astro site with an agent-first runtime. Update it whenever the project adds or changes major architecture, MCP servers, skills, libraries, content models, routes, or implementation priorities.

## FIH Migration Status

Completed on 2026-06-21: `/home/salah/falafelinhotpot/02_web/site` was migrated into this Virex Astro 5 base as the public Falafel in Hotpot site.

Locked outcomes:

- Virex remains the technical base on Astro 5.
- Falafel in Hotpot is the public brand and typography system.
- Public pages use Astro-first layouts/components with React islands only for forms, tabs, breadcrumbs, FAQ, cards, and toasts.
- Edition archive listings use the FIH-branded list layout (`List` / `ListItem`) with a docs-style segmented filter (`EditionFilter`) and rounded edition cards.
- Edition article pages use a Notion-style hero banner (`EditionHero`), refined article footer (`ArticleFooter`), card subscribe CTA, and redesigned edition navigation (`EditionNav`).
- Source edition MDX was migrated verbatim into `src/content/editions`.
- ActiveCampaign newsletter submission behavior is preserved in `src/components/islands/NewsletterForm.tsx`.
- Virex demo routes and content were moved to `src/_virex-demo/`.
- Demo public image folders were moved out of `public/` and into `src/_virex-demo/public/images/`.
- Dashboard and `/api/agent` routes remain internal and were not redesigned for the FIH public migration.

Active public FIH routes:

- `/`
- `/about`
- `/links`
- `/subscribe`
- `/contact`
- `/editions`
- `/editions/[slug]`
- `/category/bridge`
- `/category/learn`
- `/courses/7-day-mandarin`
- `/privacy`
- `/terms`
- `/rss.xml`
- `/404`

Migration files:

- `PRODUCT.md`: FIH product/design context for future design work.
- `MIGRATION_ASSETS.md`: source-to-target asset migration manifest.
- `netlify.toml`: security/cache headers and legacy redirects.

## Product Direction

Primary goal: use Virex as the preserved upstream base for a multi-purpose Astro site whose public surface is Falafel in Hotpot and whose internal dashboard/agent surfaces remain available for later phases.

The site supports:

- newsletter publishing and signup flows
- blog archive for old newsletter content
- landing pages and course announcements
- learning web apps, starting with pinyin charts and hanzi practice
- internal agent workflows for content, SEO, UI review, and app scaffolding

Current register: public routes are `brand`; dashboard and agent routes are `product`.

## Current State

Base:

- Official Virex Astro theme cloned from `https://github.com/erlandv/virex`
- MIT license
- Astro 5, TypeScript, Tailwind CSS v4, MDX, RSS, sitemap, astro-icon
- Active public content collection: `editions`
- Existing UI surfaces: marketing pages, dashboard shell, auth forms, dashboard cards, charts, tables, modal, toast

Added agent slice:

- `src/lib/agent/types.ts`: Agent, Tool, ToolCall, MCP server types
- `src/lib/agent/tools/registry.ts`: local tool registry
- `src/lib/agent/tools/local-tools.ts`: `project_context` starter tool
- `src/lib/agent/providers/planning-agent.ts`: deterministic local provider
- `src/lib/agent/mcp/servers.ts`: MCP server list
- `src/lib/agent/mcp/client.ts`: HTTP JSON-RPC MCP client scaffold
- `src/pages/api/agent.ts`: POST endpoint
- `src/pages/dashboard/agent.astro`: dashboard test UI
- `src/config/dashboard-navigation.ts`: Agent nav item
- `docs/10-agent-framework.md`: agent framework notes

Runtime change:

- `@astrojs/node@9.5.5` added so dynamic server routes can coexist with static-prerendered pages.
- `astro.config.mjs` uses `output: 'static'` plus the Node standalone adapter.
- `@astrojs/react@4.4.2`, React 19, Sonner, Radix, and the small shadcn subset are installed for FIH public islands.

## Verification

Most recent checks:

- `npm run build`: passing (2026-06-22)
- Edition listings switched to list layout on `/`, `/editions`, category pages, and related-editions blocks
- `npm run check`: passing, 0 errors, 0 warnings, 4 TypeScript deprecation hints from React 19 event types
- Generated FIH routes include `/`, `/about`, `/links`, `/subscribe`, `/contact`, `/editions`, all migrated `/editions/[slug]`, `/category/bridge`, `/category/learn`, `/courses/7-day-mandarin`, `/privacy`, `/terms`, `/rss.xml`, and `/404`
- `/dashboard/agent`: returns 200 in dev
- `/api/agent`: returns structured JSON with `text`, `toolCalls`, and `metadata`

Known notes:

- `SITE_URL` falls back to `https://falafelinhotpot.com`; production should still define `SITE_URL=https://falafelinhotpot.com`.
- npm audit reports upstream dependency vulnerabilities. Do not run `npm audit fix` blindly because it may rewrite the theme dependency tree.
- `src/content/editions/*.mdx` is intentionally ignored by Prettier to preserve migrated editorial bodies verbatim.

## Installed Agent Skills

Available locally:

- `impeccable`: UI/UX product and interface design workflow
- `web-design-guidelines`: UI/accessibility review guidance
- `seo`: web quality SEO skill
- `seo-audit`: marketing SEO audit workflow
- `programmatic-seo`: scalable SEO/content workflow
- `accessibility`: web accessibility review workflow

Install notes:

- Skills were installed into `~/.agents/skills/`.
- The skills CLI reported successful Codex-visible copies and also reported that one PromptScript target does not support global skill installation. Treat the folders above as the source of truth for Codex usage.

Usage policy:

- Use `impeccable` before designing or changing public UI, dashboard UI, app UI, empty states, onboarding, or visual hierarchy.
- Use `seo` or `seo-audit` before publishing public landing pages, newsletter archive pages, course pages, or large content changes.
- Use `programmatic-seo` before generating repeatable content systems such as glossary pages, lesson indexes, Chinese learning resources, or long-tail landing pages.
- Use `accessibility` or `web-design-guidelines` before shipping interactive UI.

## MCP Plan

Configured now:

- `astro-docs`: `https://mcp.docs.astro.build/mcp`
  - Present in `.cursor/mcp.json`
  - Present in `.claude/mcp.json`
  - Present as example in `.codex/mcp.example.toml`
  - Present in `src/lib/agent/mcp/servers.ts`

High-value MCPs to add next:

- GitHub MCP: repository issues, PRs, discussions, changelog planning, release notes
- Playwright/browser MCP: visual QA, responsive checks, screenshot-driven UI review
- Filesystem/document MCP: controlled local document indexing if editor/runtime needs it beyond Codex file access
- Search/web research MCP: current SEO research, competitor research, course market research
- Analytics/Search Console MCP: once the site is deployed and verified
- Content/newsletter provider MCP or API wrapper: Buttondown, ConvertKit, Beehiiv, Substack, or chosen provider
- Database/content backend MCP: only after deciding whether app data lives in files, SQLite, Postgres, Turso, Supabase, or another service

Do not add API-key MCPs until the vendor/provider is chosen.

## UI Library Position

Default rule: preserve Virex first. Do not replace the theme with a component framework.

Already available:

- Virex Astro components for layout, dashboard, forms, cards, charts, tables, modal, toast
- `astro-icon` with Lucide and Simple Icons
- Tailwind CSS v4 tokens in `src/styles/global.css`
- Chart.js through the existing Virex chart component

Recommended additions before full agent UI:

- React island support: `@astrojs/react`, only if the agent UI needs richer state, streaming, command palettes, or complex client interactions.
- AI SDK: `ai` plus provider package when the LLM provider is chosen. Useful for streaming, tool-call normalization, and provider abstraction.
- Accessible headless primitives:
  - If React is added: prefer React Aria or Radix UI for dialogs, popovers, comboboxes, tabs, and menus.
  - If staying framework-agnostic: evaluate Shoelace web components for accessible primitives.
- Tables/search:
  - Keep Virex `DataTable` for simple admin tables.
  - Add TanStack Table only when sorting, filtering, pagination, and column visibility become real requirements.
- Forms:
  - Keep current Astro form components for simple pages.
  - Add a validation/form library only when multi-step forms, client validation, or complex field arrays appear.

Avoid for now:

- Full shadcn migration. It would fight the Virex structure unless the project commits to React islands broadly.
- Decorative UI libraries before content architecture and agent runtime are stable.
- Animation libraries until there is a concrete interaction or storytelling need.

## SEO Architecture Gaps

Already present:

- `src/components/common/SEO.astro`
- `@astrojs/rss`
- `@astrojs/sitemap`
- `src/pages/robots.txt.ts`
- `src/pages/rss.xml.ts`
- `editions` content collection
- Canonical fallback to `https://falafelinhotpot.com`
- Article JSON-LD on edition pages
- Sitemap filter for active FIH public routes only
- Netlify redirects for `/blog`, `/archive`, and `/newsletter` legacy paths

Missing before serious publishing:

- Final OG image strategy for all public pages
- Course announcement schema refinement
- Programmatic SEO rules for generated learning pages
- Internal linking rules across newsletter, blog, course, and app pages
- Content freshness and review workflow
- Search Console/analytics deployment plan

## Content Architecture Gaps

Recommended collections to add after product direction is confirmed:

- `newsletter`
  - issue title, description, published date, canonical source, archive status, tags, series, original URL
- `courses`
  - title, slug, status, launch date, audience, price/free flag, signup URL, lessons/modules
- `apps`
  - name, route, status, description, related content, learning level
- `resources`
  - glossary, pinyin references, hanzi practice assets, downloadable material

Keep old newsletter archive content as content collections unless there is a strong need for a CMS.

## Agent Runtime Gaps

Still missing:

- Real provider adapter: OpenAI, Anthropic, or a provider-neutral AI SDK adapter
- Runtime secrets/env handling
- Streaming response endpoint
- Tool-call persistence and audit log
- Tool permission boundaries
- MCP tool discovery and adapter from remote MCP tools to `AgentTool`
- Error model for provider/tool/MCP failures
- Rate limiting and abuse controls
- Authentication for dashboard agent routes
- Human approval workflow before content writes
- Evaluation fixtures for tool behavior
- Tests for `ToolRegistry`, provider adapter, and `/api/agent`

Recommended next order:

1. Add provider selection and env config without changing UI.
2. Add streaming to `/api/agent`.
3. Add MCP tool discovery for Astro Docs.
4. Add content-safe write tools that draft files but require approval before commit.
5. Add dashboard history/audit UI.

## Implementation Roadmap

Phase 0: Base and tracker

- Done: clone Virex
- Done: install and verify
- Done: first agent runtime slice
- Done: add this `PROJECT.md`

Phase 1: Project foundation

- Write `PRODUCT.md` after answering the open product questions.
- Generate `DESIGN.md` from Virex tokens and components.
- Decide newsletter provider and migration source.
- Decide LLM provider and deployment target.
- Set `SITE_URL` strategy.

Phase 2: Agent runtime

- Add real provider adapter.
- Add streaming UI.
- Add MCP discovery and tool adapter.
- Add permissions, logging, and error states.
- Add tests.

Phase 3: Content and SEO

- Add newsletter/course/app/resource collections.
- Add canonical, schema, OG, and redirect policy.
- Import old newsletter content.
- Build internal linking model.
- Run SEO audit before publication.

Phase 4: UI and apps

- Stabilize UI primitives.
- Build pinyin chart app.
- Build hanzi practice app.
- Add learning-resource routes.
- Run accessibility and responsive audits.

## Update Protocol

Update this file when:

- a new dependency is added
- an MCP server is added, removed, or moved from candidate to active
- a skill is installed or becomes required for a workflow
- a content collection or route family is added
- a major architecture decision is made
- a verification command changes status
- a blocker is found

Keep updates concise. Prefer changing status and adding dated notes over rewriting the whole file.
