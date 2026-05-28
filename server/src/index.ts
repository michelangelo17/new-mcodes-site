// index.ts
//
// One container, two jobs:
//   1. Serve the built static Astro site (the writing).
//   2. Mount the MCP server at /mcp.
//
// Both are stateless, so the whole thing scales to zero on Serverless
// Containers with no idle cost. When you add the metered Layer-2 "ask my
// writing" widget later, split THAT into its own container so a flaky/rate-
// limited model call can never take the writing or the MCP endpoint down. For
// now there is nothing metered here, so one container is the right size.

import express from "express";
import { join } from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./mcp.js";

const PORT = Number(process.env.PORT ?? 8080); // Serverless Containers inject PORT
const SITE_DIST = process.env.SITE_DIST ?? join(process.cwd(), "..", "site", "dist");

const app = express();

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

// MCP endpoint, stateless mode: a fresh server + transport per request, no
// session state held between requests (the correct shape for scale-to-zero).
app.post("/mcp", express.json(), async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: "internal error" });
    server.close();
  }
});

// Stateless mode has no server-initiated SSE stream, so GET/DELETE are not used.
app.all("/mcp", (_req, res) => {
  res.status(405).set("Allow", "POST").json({ error: "Method Not Allowed" });
});

// Everything else: the static site.
app.use(express.static(SITE_DIST));

app.listen(PORT, () => {
  console.log(`listening on :${PORT}  (site: ${SITE_DIST})`);
});
