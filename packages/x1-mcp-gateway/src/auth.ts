import { createRemoteJWKSet, jwtVerify } from "jose";
import { checkTenant, requireSecureEndpoint, requireMatchingAuthorization } from "./policy.mjs";

export type X1Principal = { token: string; actorId: string };
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
export async function verifyBearer(request: Request): Promise<X1Principal> {
  const raw = request.headers.get("authorization") ?? "";
  if (!raw.startsWith("Bearer ") || raw.length > 8192) throw new Error("AUTHENTICATION_REQUIRED");
  const token = raw.slice(7);
  const issuer = process.env.X1_JWT_ISSUER;
  const audience = process.env.X1_JWT_AUDIENCE;
  const jwksUrl = process.env.X1_JWKS_URL;
  if (!issuer || !audience || !jwksUrl) throw new Error("JWT_VERIFIER_NOT_CONFIGURED");
  if (!jwks) jwks = createRemoteJWKSet(new URL(requireSecureEndpoint(jwksUrl)));
  const verified = await jwtVerify(token, jwks, { issuer, audience, algorithms: ["RS256", "ES256"], clockTolerance: 5 });
  if (!verified.payload.sub) throw new Error("SUBJECT_REQUIRED");
  const scope = typeof verified.payload.scope === "string" ? verified.payload.scope.split(/\s+/) :
    Array.isArray(verified.payload.scp) ? verified.payload.scp : [];
  if (!scope.includes("x1:mcp")) throw new Error("SCOPE_REQUIRED");
  return { token, actorId: verified.payload.sub };
}
export async function verifyCapability(principal: X1Principal, tenantInput: string, capability: string) {
  const tenantId = checkTenant(tenantInput);
  const endpoint = requireSecureEndpoint(process.env.X1_AUTHZ_URL);
  const abort = AbortSignal.timeout(8000);
  const serviceToken = process.env.X1_AUTHZ_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("AUTHZ_SERVICE_TOKEN_NOT_CONFIGURED");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: "Bearer " + serviceToken, "content-type": "application/json" },
    body: JSON.stringify({ actor_id: principal.actorId, tenant_id: tenantId, capability }),
    redirect: "error",
    signal: abort
  });
  if (!response.ok) throw new Error("AUTHORIZATION_UNAVAILABLE");
  const decision = await response.json() as unknown;
  requireMatchingAuthorization(decision, principal.actorId, tenantId, capability);
  return tenantId;
}
