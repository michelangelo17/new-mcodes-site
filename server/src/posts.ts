// posts.ts
//
// The single source of truth for the writing is a directory of Markdown files
// with YAML frontmatter (the same files Astro renders for human readers).
// This module is the *second consumer* of those files: it loads them so the
// MCP server can expose them to agents. One source, two views.
//
// POSTS_DIR points at that directory. In local dev it defaults to the Astro
// content folder; in the container the Dockerfile copies the posts in and sets
// POSTS_DIR explicitly.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export interface Post {
  slug: string;
  title: string;
  date: string; // ISO date
  tags: string[];
  summary: string;
  canonicalUrl?: string; // set when a piece is canonical elsewhere (e.g. dev.to)
  body: string; // raw Markdown
}

export interface PostIndexEntry {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  canonicalUrl?: string;
}

const POSTS_DIR =
  process.env.POSTS_DIR ?? join(process.cwd(), "..", "site", "src", "content", "posts");

function deriveSlug(filename: string): string {
  // Matches Astro's glob loader, which keys posts by filename without the
  // extension — for both .md and .mdx — so slugs line up on both sides.
  return filename.replace(/\.mdx?$/i, "");
}

// MDX bodies carry ESM `import`/`export` statements that are plumbing, not
// prose. Strip those lines so an agent reading the markdown doesn't get noise.
// JSX component tags are left in place: their text children stay readable, and
// a bare embed tag (e.g. <Chart/>) at least signals "rendered content here" —
// which is more honest than silently dropping it. A full MDX-to-markdown
// transform would need a parser dependency; not worth it until posts lean
// heavily on components.
function stripMdxNoise(body: string): string {
  return body
    .split("\n")
    .filter(
      (line) =>
        !/^\s*import\s.+\bfrom\s+['"][^'"]+['"];?\s*$/.test(line) &&
        !/^\s*import\s+['"][^'"]+['"];?\s*$/.test(line) &&
        !/^\s*export\s+(const|let|var|default|function|async|class|\{)/.test(line),
    )
    .join("\n")
    .trim();
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (cache) return cache;
  if (!existsSync(POSTS_DIR)) {
    throw new Error(`POSTS_DIR does not exist: ${POSTS_DIR}`);
  }
  const files = readdirSync(POSTS_DIR).filter((f) => /\.mdx?$/i.test(f));
  const posts: Post[] = files.map((file) => {
    const raw = readFileSync(join(POSTS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const isMdx = /\.mdx$/i.test(file);
    return {
      slug: (data.slug as string) ?? deriveSlug(file),
      title: (data.title as string) ?? deriveSlug(file),
      date: data.date ? new Date(data.date).toISOString().slice(0, 10) : "",
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      summary: (data.summary as string) ?? "",
      canonicalUrl: (data.canonicalUrl as string) ?? undefined,
      body: isMdx ? stripMdxNoise(content) : content.trim(),
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  cache = posts;
  return posts;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function buildIndex(): PostIndexEntry[] {
  return getAllPosts().map(({ body, ...entry }) => entry);
}
