import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

// Site URL from environment variable with production fallback for stable canonical URLs.
const siteUrl = process.env.SITE_URL || 'https://falafelinhotpot.com';

// Lastmod map for edition pages, read from frontmatter publishDate/updateDate (ISO dates).
const editionsDir = path.join(process.cwd(), 'src/content/editions');
const editionLastmod = new Map();
for (const file of fs.readdirSync(editionsDir)) {
  if (!file.endsWith('.mdx')) continue;
  const source = fs.readFileSync(path.join(editionsDir, file), 'utf8');
  const updateDate = source.match(/^updateDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const publishDate = source.match(/^publishDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const lastmod = updateDate ?? publishDate;
  if (lastmod) {
    const slug = file.replace(/\.mdx$/, '');
    editionLastmod.set(`${siteUrl}/editions/${slug}/`, lastmod);
  }
}
const publicRoutePrefixes = [
  '/',
  '/subscribe',
  '/editions',
  '/category/bridge',
  '/category/learn',
  '/mandarin-starterkit-course',
  '/pinyin-chart',
  '/get-your-chinese-business-guide',
];

// Custom integration to warn about missing environment variables after build
function envCheckIntegration() {
  return {
    name: 'env-check',
    hooks: {
      'astro:build:done': () => {
        if (!process.env.SITE_URL) {
          console.warn('='.repeat(60));
          console.warn('WARNING: SITE_URL environment variable not set');
          console.warn('Build completed with fallback URL: https://falafelinhotpot.com');
          console.warn('For production, set SITE_URL=https://falafelinhotpot.com');
          console.warn('='.repeat(60) + '\n');
        }
      },
    },
  };
}

/** Astro dev does not serve public/subdir/index.html for /subdir/ — rewrite in dev. */
function mandarinLandingDevPlugin() {
  return {
    name: 'mandarin-landing-dev',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? '';
        const [pathname, search = ''] = raw.split('?');
        if (
          pathname === '/mandarin-starterkit-course' ||
          pathname === '/mandarin-starterkit-course/'
        ) {
          req.url = `/mandarin-starterkit-course/index.html${search ? `?${search}` : ''}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    mdx(),
    react(),
    icon(),
    envCheckIntegration(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
        return publicRoutePrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
        );
      },
      // Static public/ routes are invisible to @astrojs/sitemap; add them explicitly.
      customPages: [`${siteUrl}/mandarin-starterkit-course/`],
      namespaces: { news: false, video: false, image: false, xhtml: false },
      serialize: (item) => {
        if (editionLastmod.has(item.url)) item.lastmod = editionLastmod.get(item.url);
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss(), mandarinLandingDevPlugin()],
  },
});
