/**
 * Site Configuration
 *
 * @description
 * Core site metadata and branding settings.
 * These values can be customized via environment variables or by editing the defaults below.
 */

/** Site name displayed in header, footer, and meta tags */
export const name = import.meta.env.SITE_NAME || 'Falafel in Hotpot';

/** Site description for SEO and meta tags */
export const description =
  import.meta.env.SITE_DESCRIPTION ||
  'A cultural journal at the confluence of the Arab world and China. Language, food, poetry, business, history — explored as equals.';

/** Production URL of your site (used for sitemap, RSS, canonical URLs) */
export const url = import.meta.env.SITE_URL || 'https://falafelinhotpot.com';

/** Author name for meta tags and copyright */
export const author = import.meta.env.SITE_AUTHOR || 'Falafel in Hotpot';

/** Path to logo file (relative to /public) */
export const logo = '/logo.svg';

/** Path to Open Graph image (relative to /public) */
export const ogImage = '/images/og-image.png';

/** Social media links */
export const social = {
  twitter: 'https://www.instagram.com/falafelinhotpott/',
  github: 'https://www.linkedin.com/company/falafel-in-hotpot/',
  discord: 'https://www.youtube.com/@falafelinhotpot',
};

/** Legal configuration for privacy policy and terms pages */
export const legal = {
  privacyEmail: 'hello@falafelinhotpot.com',
  legalEmail: 'hello@falafelinhotpot.com',
  lastUpdated: 'June 21, 2026',
};

export const siteConfig = {
  name,
  description,
  url,
  author,
  logo,
  ogImage,
  social,
  legal,
};
