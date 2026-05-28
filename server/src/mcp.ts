// MCP surface: read-only, published material only. No model here — the
// connecting agent brings its own.
//   resources: posts://index, posts://{slug}
//   tools:     search_posts, get_post, query_findings (gated)

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildIndex, getAllPosts, getPost } from "./posts.js";
import { searchPosts } from "./search.js";

export const buildServer = (): McpServer => {
  const server = new McpServer({
    name: "blog",
    version: "0.1.0",
  });

  // posts://index — metadata list of everything published.
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

  // posts://{slug} — one post as Markdown + frontmatter. The list callback
  // enumerates posts as discrete resources.
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

  // Gated behind FINDINGS_ENABLED: contract defined, but dark until the dataset
  // is real. Returns "not published" rather than fabricated rows.
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
        content: [{ type: "text", text: JSON.stringify({ status: "dataset not yet published" }) }],
      }),
    );
  }

  return server;
};
