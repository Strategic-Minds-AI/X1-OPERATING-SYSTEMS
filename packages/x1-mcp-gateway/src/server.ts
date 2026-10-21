import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { capabilityGroups } from "./policy.mjs";
import { verifyCapability, type X1Principal } from "./auth.js";
import { adapterCall } from "./adapter.js";
const groups = capabilityGroups as Record<string, string[]>;
const schema = z.object({
  tenantId: z.string().uuid(),
  subject: z.string().max(600).optional(),
  dryRun: z.literal(true).default(true)
});
const descriptions: Record<string, string> = {
  supergpt: "X1 SuperGPT Command: capability discovery, mission plans and read-only job status",
  website: "X1 Website Factory: approved templates and noindex preview preparation/status",
  search: "X1 Search Dominance: draft SEO audit and measured analytics reports",
  social: "X1 Social Autopilot: campaign drafts and observed performance; no publishing",
  revenue: "X1 Revenue Intelligence: opportunity reports and proposal drafts; no outreach"
};
export function buildServer(principal: X1Principal) {
  const server = new McpServer({ name: "x1-infinity-gateway", version: "0.1.0" });
  for (const [group, operations] of Object.entries(groups)) {
    for (const operation of operations) {
      server.registerTool("x1_" + group + "_" + operation, {
        description: descriptions[group] + " | operation " + operation +
          " | staging-only; verified tenant authorization required; no production or publication",
        inputSchema: schema.shape
      }, async (input) => {
        const capability = group + "." + operation;
        try {
          const tenantId = await verifyCapability(principal, input.tenantId, capability);
          const result = await adapterCall(group, operation,
            { tenantId, subject: input.subject, dryRun: true }, principal);
          return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
        } catch (error) {
          // Avoid leaking bearer tokens or upstream response bodies into MCP output.
          const name = error instanceof Error ? error.message : "UNKNOWN_ERROR";
          const allowedCodes = /^(AUTHORIZATION_DENIED|AUTHORIZATION_UNAVAILABLE|ADAPTER_NOT_CONFIGURED|ADAPTER_CREDENTIAL_NOT_CONFIGURED|ADAPTER_HTTP_[0-9]{3}|OPERATION_NOT_ALLOWED|DRY_RUN_REQUIRED|TENANT_INVALID|UNSAFE_ADAPTER_URL)$/;
          const code = allowedCodes.test(name) ? name : "PROVIDER_UNAVAILABLE";
          return { isError: true, content: [{ type: "text" as const,
            text: JSON.stringify({ status: "BLOCKED", capability, code, job_created: false }) }] };
        }
      });
    }
  }
  return server;
}
