// Keyword-only search: no model in the request path, so it's free per call.
// Embeddings upgrade seam: precompute one vector per post at build time, ship
// them with the image, and swap score() for cosine similarity. No vector DB
// needed for a few dozen posts.

import { getAllPosts, type Post } from "./posts.js";

export interface SearchHit {
  slug: string;
  title: string;
  score: number;
  snippet: string;
}

const tokenize = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

// Weighted by field: title > tags > summary > body.
const score = (post: Post, terms: string[]): number => {
  const title = tokenize(post.title);
  const tags = post.tags.flatMap(tokenize);
  const summary = tokenize(post.summary);
  const body = tokenize(post.body);
  let s = 0;
  for (const t of terms) {
    s += title.filter((w) => w === t).length * 5;
    s += tags.filter((w) => w === t).length * 4;
    s += summary.filter((w) => w === t).length * 3;
    s += body.filter((w) => w === t).length * 1;
  }
  return s;
};

const snippet = (post: Post, terms: string[]): string => {
  const lower = post.body.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  const start = at === -1 ? 0 : Math.max(0, at - 60);
  return (start > 0 ? "…" : "") + post.body.slice(start, start + 200).replace(/\s+/g, " ").trim() + "…";
};

export const searchPosts = (query: string, limit = 5): SearchHit[] => {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  return getAllPosts()
    .map((post) => ({ slug: post.slug, title: post.title, score: score(post, terms), snippet: snippet(post, terms) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
