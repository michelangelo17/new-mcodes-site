// Frontmatter contract — kept in sync with server/src/posts.ts.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: () =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			tags: z.array(z.string()).default([]),
			summary: z.string(),
			canonicalUrl: z.string().url().optional(),
		}),
});

export const collections = { posts };
