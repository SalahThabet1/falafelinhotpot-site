import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { ImageMetadata } from 'astro';

export interface Taxonomy {
  slug: string;
  title: string;
}

export interface MetaDataImage {
  url: string;
  width?: number;
  height?: number;
}

export interface MetaDataOpenGraph {
  url?: string;
  siteName?: string;
  images?: Array<MetaDataImage>;
  locale?: string;
  type?: string;
}

export interface MetaDataTwitter {
  handle?: string;
  site?: string;
  cardType?: string;
}

export interface MetaDataRobots {
  index?: boolean;
  follow?: boolean;
}

export interface MetaData {
  title?: string;
  ignoreTitleTemplate?: boolean;
  canonical?: string;
  robots?: MetaDataRobots;
  description?: string;
  openGraph?: MetaDataOpenGraph;
  twitter?: MetaDataTwitter;
}

export interface Post {
  id: string;
  slug: string;
  permalink: string;
  publishDate: Date;
  updateDate?: Date;
  title: string;
  titleZh?: string;
  titleAr?: string;
  excerpt?: string;
  image?: ImageMetadata;
  category?: Taxonomy;
  tags?: Taxonomy[];
  author?: string;
  issueNumber?: number;
  series?: 'cultural' | 'learn';
  subjectLine?: string;
  subtitleArabic?: string;
  bilingual?: boolean;
  metadata?: MetaData;
  draft?: boolean;
  Content?: AstroComponentFactory;
  readingTime?: number;
}
