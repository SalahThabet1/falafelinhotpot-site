import type { PaginateFunction } from 'astro';
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Post } from '~/types';
import { cleanSlug } from './permalinks';

export const blogPostsPerPage = 9;
export const blogPostRobots = { index: true, follow: true };
export const blogCategoryRobots = { index: true, follow: true };

const generatePermalink = (slug: string) => `/editions/${slug}`;

// Strip MDX imports and HTML/JSX tags before counting so markup (e.g. <span
// class="zh"> vs <Zh>, or an added component import) never inflates or shifts
// the estimate — only real prose counts.
const estimateReadingTime = (body = '') =>
  Math.max(
    1,
    Math.ceil(
      body
        .replace(/^import .+$/gm, ' ')
        .replace(/<[^>]*>/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length / 220
    )
  );

const getNormalizedPost = async (entry: CollectionEntry<'editions'>): Promise<Post> => {
  const { id, data, body } = entry;
  const { Content } = await render(entry);
  const slug = cleanSlug(id.replace(/\.(md|mdx)$/, ''));
  const category = {
    slug: cleanSlug(data.category),
    title: data.category,
  };

  return {
    id,
    slug,
    permalink: generatePermalink(slug),
    publishDate: new Date(data.publishDate),
    updateDate: data.updateDate ? new Date(data.updateDate) : undefined,
    title: data.title,
    titleZh: data.titleZh,
    titleAr: data.titleAr,
    excerpt: data.excerpt,
    image: data.image,
    category,
    tags: (data.tags ?? []).map((tag: string) => ({ slug: cleanSlug(tag), title: tag })),
    author: 'Falafel',
    issueNumber: data.issueNumber,
    series: data.series,
    subjectLine: data.subjectLine,
    subtitleArabic: data.subtitleArabic,
    bilingual: data.bilingual,
    metadata: data.metadata,
    draft: data.draft,
    Content,
    readingTime: estimateReadingTime(body),
  };
};

let cachedPosts: Post[] | undefined;

export const fetchPosts = async (): Promise<Post[]> => {
  if (!cachedPosts) {
    const entries = await getCollection('editions');
    cachedPosts = (await Promise.all(entries.map(getNormalizedPost)))
      .filter((post) => !post.draft)
      .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf());
  }
  return cachedPosts;
};

export const getStaticPathsBlogPost = async () =>
  (await fetchPosts()).map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));

export const getStaticPathsBlogCategory = async ({ paginate }: { paginate: PaginateFunction }) => {
  const posts = await fetchPosts();
  const categories = new Map<string, { slug: string; title: string }>();
  posts.forEach((post) => {
    if (post.category) categories.set(post.category.slug, post.category);
  });

  return Array.from(categories.values()).flatMap((category) =>
    paginate(
      posts.filter((post) => post.category?.slug === category.slug),
      {
        params: { category: category.slug },
        pageSize: blogPostsPerPage,
        props: { category },
      }
    )
  );
};

export async function getRelatedPosts(originalPost: Post, maxResults = 3): Promise<Post[]> {
  const originalTags = new Set(originalPost.tags?.map((tag) => tag.slug) ?? []);
  return (await fetchPosts())
    .filter((post) => post.slug !== originalPost.slug)
    .map((post) => {
      const categoryScore = post.category?.slug === originalPost.category?.slug ? 5 : 0;
      const tagScore = post.tags?.filter((tag) => originalTags.has(tag.slug)).length ?? 0;
      return { post, score: categoryScore + tagScore };
    })
    .sort(
      (a, b) => b.score - a.score || b.post.publishDate.valueOf() - a.post.publishDate.valueOf()
    )
    .slice(0, maxResults)
    .map(({ post }) => post);
}
