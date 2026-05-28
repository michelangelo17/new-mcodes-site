// mcp.ts
//
// THE SCHEMA: what your site exposes to other people's agents.
//
// The inversion of the usual "RAG wrapper": no model lives here. This server
// publishes your writing (and, later, the artefact-one findings) as MCP
// resources and tools. A connecting agent brings its own model and its own
// inference budget. Your cost is just the container, which scales to zero.
//
// Two kinds of surface:
//   RESOURCES  = addressable content an agent can read   (posts://index, posts://{slug})
//   TOOLS      = actions an agent can call                (search_posts, get_post, query_findings)
//
// A note that is itself a small preview of artefact one: every line below is a
// trust-boundary decision. This server is read-only, exposes only published
// material, and advertises query_findings only once real data exists. What you
// choose NOT to expose is part of the design, not an afterthought.

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildIndex, getAllPosts, getPost } from "./posts.js";
import { searchPosts } from "./search.js";

export function buildServer(): McpServer {
  const server = new McpServer({
    name: "blog",
    version: "0.1.0",
  });

  // ---- RESOURCE: the index ------------------------------------------------
  // A single addressable list of everything published, with metadata. An agent
  // fetches this to discover what is here without scraping HTML.
  server.registerResource(
    "post-index",
    "posts://index",
    {
      title: "Post index",
      description: "List of all published posts with metadata (title, date, tags, summary, canonical URL).",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(buildIndex(), null, 2),
        },
      ],
    }),
  );

  // ---- RESOURCE: a single post by slug ------------------------------------
  // Templated resource: posts://{slug}. The `list` callback enumerates every
  // post so an agent can browse them as discrete resources; the read callback
  // returns clean Markdown plus frontmatter, not rendered HTML.
  server.registerResource(
    "post",
    new ResourceTemplate("posts://{slug}", {
      list: async () => ({
        resources: getAllPosts().map((p) => ({
          uri: `posts://${p.slug}`,
          name: p.title,
          description: p.summary,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: "Post",
      description: "A single post as Markdown with its frontmatter metadata.",
      mimeType: "text/markdown",
    },
    async (uri, { slug }) => {
      const post = getPost(String(slug));
      if (!post) {
        return { contents: [{ uri: uri.href, mimeType: "text/plain", text: `No post: ${slug}` }] };
      }
      const front = [
        `title: ${post.title}`,
        `date: ${post.date}`,
        `tags: ${post.tags.join(", ")}`,
        post.canonicalUrl ? `canonical: ${post.canonicalUrl}` : null,
      ].filter(Boolean).join("\n");
      return {
        contents: [
          { uri: uri.href, mimeType: "text/markdown", text: `---\n${front}\n---\n\n${post.body}` },
        ],
      };
    },
  );

  // ---- TOOL: search_posts -------------------------------------------------
  // Keyword search (see search.ts). Returns ranked hits with snippets so an
  // agent can decide which posts to fetch in full.
  server.registerTool(
    "search_posts",
    {
      title: "Search posts",
      description: "Search the writing by keyword. Returns ranked matches with a snippet and slug. Fetch full text via get_post or the posts://{slug} resource.",
      inputSchema: {
        query: z.string().describe("Search terms."),
        limit: z.number().int().min(1).max(20).optional().describe("Max results (default 5)."),
      },
    },
    async ({ query, limit }) => {
      const hits = searchPosts(query, limit ?? 5);
      return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
    },
  );

  // ---- TOOL: get_post -----------------------------------------------------
  server.registerTool(
    "get_post",
    {
      title: "Get post",
      description: "Fetch the full Markdown of one post by slug.",
      inputSchema: { slug: z.string().describe("Post slug, e.g. 'the-harness-became-a-product'.") },
    },
    async ({ slug }) => {
      const post = getPost(slug);
      if (!post) return { content: [{ type: "text", text: `No post with slug: ${slug}` }], isError: true };
      return { content: [{ type: "text", text: post.body }] };
    },
  );

  // ---- TOOL: query_findings (gated) ---------------------------------------
  // The standout, switched on only when the artefact-one dataset exists. This
  // is the piece that makes the server original: it exposes your *measurements*
  // as a composable tool other agents can build on, which is protocol-layer
  // participation rather than tool-building on top of the layer.
  //
  // The contract is defined now so the shape is concrete; FINDINGS_ENABLED
  // keeps it unadvertised until the data is real. Do not let a later edit
  // upgrade a documented-but-unmeasured field into a reported result.
  if (process.env.FINDINGS_ENABLED === "true") {
    server.registerTool(
      "query_findings",
      {
        title: "Query findings",
        description: "Query the managed-harness trust-boundary study: security-relevant behaviour by runtime and attack class.",
        inputSchema: {
          runtime: z.enum(["agentcore", "openai_agents", "claude_managed", "strands_selfhosted", "scaleway_openweight"]).optional(),
          attack_class: z.enum(["agent_card_spoofing", "context_leakage", "capability_redelegation", "injection_propagation", "task_replay"]).optional(),
        },
      },
      async () => ({
        // Replace with a read against the published dataset (CSV/Parquet shipped
        // with the image or fetched from Object Storage). Returns rows + the CI,
        // never a single run, matching the study's own rigour bar.
        content: [{ type: "text", text: JSON.stringify({ status: "dataset not yet published" }) }],
      }),
    );
  }

  return server;
}
