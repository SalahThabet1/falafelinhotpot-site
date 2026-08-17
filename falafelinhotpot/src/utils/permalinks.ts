import { trim } from './utils';
import { url as SITE_URL } from '~/config/site';

const trimSlash = (s: string) => trim(trim(s, '/'));

export const cleanSlug = (text = '') =>
  trimSlash(text)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getCanonical = (path = ''): string => String(new URL(path, SITE_URL));

export const getHomePermalink = (): string => '/';
export const getBlogPermalink = (): string => '/editions';

export const getPermalink = (slug = ''): string => {
  if (
    slug.startsWith('https://') ||
    slug.startsWith('http://') ||
    slug.startsWith('://') ||
    slug.startsWith('#') ||
    slug.startsWith('javascript:')
  ) {
    return slug;
  }
  return '/' + trimSlash(slug);
};
