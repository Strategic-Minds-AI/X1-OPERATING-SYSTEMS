import { serve } from "@hono/node-server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { buildServer } from "./server.js";
import { verifyBearer } from "./auth.js";
import { allowOrigin } from "./policy.mjs";

const handler = createMcpHandler(({ authInfo }) => {
  if (!authInfo || !authInfo.clientId || !authInfo.token) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }
  return buildServer({ actorId: authInfo.clientId, token: authInfo.token });
}, { legacy: "reject" });
const port = Number(process.env.PORT ?? 4318);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT_INVALID");
serve({
  port,
  hostname: process.env.HOST ?? "127.0.0.1",
  fetch: async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (url.pathname === "/healthz" && request.method === "GET") {
      return Response.json({ status: "UP", name: "x1-infinity-gateway",
        operations: 12, adapter_verified: false, worker_verified: false });
    }
    if (url.pathname !== "/mcp") return new Response("Not found", { status: 404 });
    if (!allowOrigin(request.headers.get("origin"), process.env.X1_ALLOWED_ORIGINS ?? "")) {
      return new Response("Origin denied", { status: 403 });
    }
    try {
      const principal = await verifyBearer(request);
      return await handler.fetch(request, { authInfo: {
        token: principal.token, clientId: principal.actorId, scopes: ["x1:mcp"]
      } });
    } catch {
      return new Response("Unauthorized", { status: 401, headers: {
        "WWW-Authenticate": 'Bearer realm="x1-mcp"'
      } });
    }
  }
});
console.error("X1 MCP staging gateway listening on 127.0.0.1:" + port);
