import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';

export const GET: APIRoute = () => {
  const robotsTxt = `# robots.txt for ${siteConfig.name}
# https://www.robotstxt.org/

User-agent: *
Allow: /

# Serverless API and the JWT-gated download redirect are not content
Disallow: /api/
Disallow: /download/

# Sitemap location
Sitemap: ${siteConfig.url}/sitemap-index.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
