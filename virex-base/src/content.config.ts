import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),
      canonical: z.string().url().optional(),
      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),
      description: z.string().optional(),
      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const editionCategories = z.enum(['Bridge', 'Learn']);

const editions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/editions' }),
  schema: z.object({
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    titleZh: z.string().optional(),
    titleAr: z.string().optional(),
    excerpt: z.string(),
    image: z.string().optional(),

    category: editionCategories,
    tags: z.array(z.string()).optional(),
    author: z.string().default('Falafel in Hotpot'),

    issueNumber: z.number().optional(),
    series: z.enum(['cultural', 'learn']).optional(),
    subjectLine: z.string().optional(),
    subtitleArabic: z.string().optional(),
    bilingual: z.boolean().optional(),

    metadata: metadataDefinition(),
  }),
});

export const collections = { editions };
