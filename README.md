# michelangelo.codes

Personal site and blog, plus an MCP server that exposes the writing to other
agents. One repository, one deployable container.

```
.
├── site/        Astro static site (the writing, for humans)
├── server/      MCP server + Express host (the writing, for agents)
├── Dockerfile   Multi-stage build: site + server -> one slim runtime image
└── .dockerignore
```

## The one contract

The posts are plain Markdown with YAML frontmatter in
`site/src/content/posts/`. Both halves read the *same files*:

- `site/src/content.config.ts` validates them for the rendered site.
- `server/src/posts.ts` loads them for the MCP server.

The frontmatter fields are the contract. Change one side, change the other:

```yaml
title: string
date: ISO date
tags: string[]
summary: string
canonicalUrl?: string   # set when canonical lives elsewhere (e.g. dev.to)
```

Slugs derive from the filename on both sides, so they line up automatically.

> **`.md` and `.mdx` both work.** For `.mdx`, the server strips `import`/`export`
> lines (ESM plumbing) so agents get clean prose, and leaves JSX component tags
> in place — wrapper components keep their text, and a bare embed tag signals
> "rendered content here." Heavily component-driven posts will read less cleanly
> for agents than prose; if that becomes common, add a proper MDX-to-markdown
> transform in `server/src/posts.ts`.

## What the server exposes

No model lives in the server — a connecting agent brings its own. The server is
read-only and publishes only finished, published material.

**Resources**
- `posts://index` — JSON list of all posts with metadata.
- `posts://{slug}` — one post as Markdown + frontmatter (templated, enumerable).

**Tools**
- `search_posts(query, limit?)` — keyword search; ranked hits with snippet + slug.
- `get_post(slug)` — full Markdown of one post.
- `query_findings(...)` — defined but **gated behind `FINDINGS_ENABLED`** (default
  off); returns "not published" until wired to the real dataset.

Transport is Streamable HTTP in **stateless** mode (a fresh server + transport
per request), so the container scales to zero cleanly.

## Local development

```bash
# Site (hot-reload dev server)
cd site && npm install && npm run dev

# Server (needs the site's posts; defaults point at ../site)
cd server && npm install && npm run build && npm start
#   site  -> http://localhost:8080/
#   mcp   -> POST http://localhost:8080/mcp
#   health-> http://localhost:8080/healthz
```

Point an MCP client (or the MCP Inspector) at `POST /mcp` to list and read.

### Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `8080` | Listen port (Serverless Containers inject this) |
| `SITE_DIST` | `../site/dist` | Built static site to serve |
| `POSTS_DIR` | `../site/src/content/posts` | Markdown posts the server reads |
| `FINDINGS_ENABLED` | `false` | Set `true` only when the findings dataset is real |

## Build & deploy (Scaleway Serverless Containers)

```bash
# Build the one image (site + server baked in)
docker build -t mcodes .

# Tag + push to your Scaleway Container Registry
docker tag mcodes rg.<region>.scw.cloud/<namespace>/mcodes:latest
docker push rg.<region>.scw.cloud/<namespace>/mcodes:latest
```

Then create a Serverless Container from the image: listen port **8080**, min
scale **0**, max scale **1–2**. Optionally add a CRON ping to `/healthz` to keep
a warm instance and avoid cold starts. Point your domain at the container.

## Roadmap

- Embeddings upgrade to `search_posts` (precompute vectors at build time, cosine
  at query time — no vector DB for a few dozen posts). Seam documented in
  `server/src/search.ts`.
- Flip `FINDINGS_ENABLED` on only when the dataset is published and wired to
  real data — never let an edit promote a documented-but-unmeasured field into a
  reported result.
