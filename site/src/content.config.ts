// The frontmatter contract.
//
// This schema is one half of a two-place contract. The other half lives in
// `server/src/posts.ts` (the MCP server's loader, which reads the *same*
// markdown files). Add or rename a field here, change it there too — otherwise
// the site and the server will silently disagree about what a post is.
//
// Fields:
//   title        — post title.
//   date         — publication date (ISO date string).
//   tags         — list of tags. Used for grouping; the server also tokenizes
//                  these for keyword search ranking.
//   summary      — short pitch. Shown in listings, fed to the server's index
//                  resource, and tokenized for search.
//   canonicalUrl — set when the canonical version of this piece lives
//                  elsewhere (e.g. dev.to cross-post). Lets the local URL exist
//                  without an SEO penalty against the canonical home.

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
