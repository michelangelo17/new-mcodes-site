# michelangelo.codes

My site + blog, and an MCP server that exposes the writing to agents.

- `site/` — Astro static site (Scaleway Object Storage origin, CloudFront edge).
- `server/` — MCP server (Scaleway Serverless Container). Resources `posts://index`,
  `posts://{slug}`; tools `search_posts`, `get_post`, and gated `query_findings`.
- `infra/` — OpenTofu (Scaleway + AWS: Route 53, ACM, CloudFront).

Posts are Markdown/MDX in `site/src/content/posts/`. The frontmatter is the
contract shared by the site (`site/src/content.config.ts`) and the server
(`server/src/posts.ts`):

```yaml
title: string
date: ISO date
tags: string[]
summary: string
canonicalUrl?: string
```

Deploy and setup: see [SETUP.md](SETUP.md).

## License

Code is MIT (see [`LICENSE`](LICENSE)). The writing in
[`site/src/content/posts/`](site/src/content/posts/) is CC BY 4.0
(see [its `LICENSE`](site/src/content/posts/LICENSE)) — feel free to share,
quote, or translate with credit.
