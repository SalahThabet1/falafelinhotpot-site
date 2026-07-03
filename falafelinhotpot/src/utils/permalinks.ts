import { trim } from './utils';

export const SITE_URL = 'https://falafelinhotpot.com';
export const BLOG_BASE = 'editions';
export const CATEGORY_BASE = 'category';
export const TAG_BASE = 'tag';

export const trimSlash = (s: string) => trim(trim(s, '/'));

export const cleanSlug = (text = '') =>
  trimSlash(text)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createPath = (...params: string[]) => {
  const paths = params
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
  return '/' + paths;
};

export const getCanonical = (path = ''): string => String(new URL(path, SITE_URL));

export const getHomePermalink = (): string => '/';
export const getBlogPermalink = (): string => '/editions';

export const getPermalink = (slug = '', type = 'page'): string => {
  if (
    slug.startsWith('https://') ||
    slug.startsWith('http://') ||
    slug.startsWith('://') ||
    slug.startsWith('#') ||
    slug.startsWith('javascript:')
  ) {
    return slug;
  }

  switch (type) {
    case 'home':
      return getHomePermalink();
    case 'blog':
      return getBlogPermalink();
    case 'category':
      return createPath(CATEGORY_BASE, slug);
    case 'tag':
      return createPath(TAG_BASE, slug);
    case 'post':
    case 'page':
    default:
      return createPath(slug);
  }
};

export const getAsset = (path: string): string => createPath(path);
