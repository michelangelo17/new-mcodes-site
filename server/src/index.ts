// MCP host on Node's built-in http — the static site is served separately, so
// this process is only the MCP endpoint and needs no framework.
// Stateless transport: fresh server + transport per request.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./mcp.js";

const PORT = Number(process.env.PORT ?? 8080);

const sendJson = (
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) => {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
};

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const httpServer = createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const path = new URL(req.url ?? "/", "http://localhost").pathname;

  if (method === "GET" && path === "/healthz") {
    return sendJson(res, 200, { ok: true });
  }

  if (method === "GET" && path === "/") {
    return sendJson(res, 200, {
      name: "michelangelo.codes MCP",
      description: "Read-only MCP server exposing the blog's writing. POST JSON-RPC to /mcp.",
      site: "https://michelangelo.codes",
    });
  }

  if (path === "/mcp") {
    // Stateless mode has no server-initiated SSE stream, so only POST is used.
    if (method !== "POST") {
      return sendJson(res, 405, { error: "Method Not Allowed" }, { Allow: "POST" });
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: "invalid JSON" });
    }

    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch {
      if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
      server.close();
    }
    return;
  }

  sendJson(res, 404, { error: "Not Found" });
});

httpServer.listen(PORT, () => {
  console.log(`mcp server listening on :${PORT}`);
});
