import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export interface Post {
  slug: string;
  title: string;
  date: string; // ISO date
  tags: string[];
  summary: string;
  canonicalUrl?: string;
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

// Set in the container; defaults to the Astro content dir for local dev.
const POSTS_DIR =
  process.env.POSTS_DIR ?? join(process.cwd(), "..", "site", "src", "content", "posts");

// Filename without extension, matching Astro's glob loader.
const deriveSlug = (filename: string): string => filename.replace(/\.mdx?$/i, "");

// Drop MDX import/export statements; keep prose and JSX tags.
const stripMdxNoise = (body: string): string =>
  body
    .split("\n")
    .filter(
      (line) =>
        !/^\s*import\s.+\bfrom\s+['"][^'"]+['"];?\s*$/.test(line) &&
        !/^\s*import\s+['"][^'"]+['"];?\s*$/.test(line) &&
        !/^\s*export\s+(const|let|var|default|function|async|class|\{)/.test(line),
    )
    .join("\n")
    .trim();

let cache: Post[] | null = null;

export const getAllPosts = (): Post[] => {
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
};

export const getPost = (slug: string): Post | undefined =>
  getAllPosts().find((p) => p.slug === slug);

export const buildIndex = (): PostIndexEntry[] =>
  getAllPosts().map(({ body, ...entry }) => entry);
