import { requireSecureEndpoint, checkOperation, assertDryRun } from "./policy.mjs";
import type { X1Principal } from "./auth.js";

export type ToolPayload = { tenantId: string; subject?: string; dryRun: true };
export async function adapterCall(group: string, operation: string, input: ToolPayload, principal: X1Principal) {
  checkOperation(group, operation);
  assertDryRun(input.dryRun);
  const base = requireSecureEndpoint(process.env.X1_ADAPTER_BASE_URL);
  const serviceToken = process.env.X1_ADAPTER_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("ADAPTER_CREDENTIAL_NOT_CONFIGURED");
  // Route is fixed by our allowlisted registry. Caller may not supply URLs, providers, or target environments.
  const url = base + "/v1/mcp/" + group + "/" + operation;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: "Bearer " + serviceToken,
      "content-type": "application/json",
      "x-x1-tenant-id": input.tenantId,
      "x-x1-actor-id": principal.actorId
    },
    body: JSON.stringify({
      tenant_id: input.tenantId, actor_id: principal.actorId, subject: input.subject ?? "",
      operation, dry_run: true, allowed_environment: "staging", publication_allowed: false
    }),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("ADAPTER_HTTP_" + response.status);
  const result = await response.json() as Record<string, unknown>;
  // A request accepted by an adapter is not proof that a worker completed the job.
  return { status: "ADAPTER_RESPONSE_UNVERIFIED", group, operation, result };
}
