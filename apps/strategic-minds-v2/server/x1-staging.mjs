// X1 preview-only Supabase adapter. This file is server-side only.
export const STAGING_PROJECT_REF = "uvdkzsbjackpjvpoxtyk";
export const STAGING_ORIGIN = "https://" + STAGING_PROJECT_REF + ".supabase.co";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPERATOR_ROLES = new Set(["OWNER", "ADMIN", "BUILDER", "VALIDATOR"]);
const QUEUE_STATUSES = ["PENDING", "LEASED", "COMPLETED", "FAILED", "BLOCKED", "DEAD_LETTER"];

export class PublicApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function resolveStagingBinding(env = {}) {
  if (env.VERCEL_ENV !== "preview" && env.VERCEL_ENV !== "development") {
    return { ok: false, code: "NON_PREVIEW_RUNTIME" };
  }
  if (!env.SUPABASE_URL) return { ok: false, code: "MISSING_STAGING_BINDING" };
  let candidate;
  try {
    candidate = new URL(env.SUPABASE_URL);
  } catch {
    return { ok: false, code: "INVALID_STAGING_URL" };
  }
  if (
    candidate.origin !== STAGING_ORIGIN ||
    candidate.pathname !== "/" ||
    candidate.search || candidate.hash ||
    candidate.username || candidate.password
  ) {
    return { ok: false, code: "NON_STAGING_TARGET" };
  }
  // Bind to the existing Vercel Preview secret by reference; never copy or expose it.
  // Origin and runtime above must be the exact, verified X1 staging target.
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  if (!env.SUPABASE_ANON_KEY || !serviceKey) {
    return { ok: false, code: "MISSING_SERVER_CREDENTIALS" };
  }
  return {
    ok: true,
    origin: candidate.origin,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey
  };
}

export function respond(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

export function readBearer(headers = {}) {
  const value = headers.authorization ?? headers.Authorization;
  const match = typeof value === "string" && /^Bearer\s+([^\s]+)$/i.exec(value);
  if (!match || match[1].length > 8192) throw new PublicApiError(401, "AUTHENTICATION_REQUIRED");
  return match[1];
}

async function fetchJson(fetchImpl, url, key, bearer, errorCode) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        apikey: key,
        authorization: "Bearer " + bearer,
        accept: "application/json"
      },
      signal: AbortSignal.timeout(6000)
    });
  } catch {
    throw new PublicApiError(503, "STAGING_UPSTREAM_UNAVAILABLE");
  }
  if (!response.ok) {
    throw new PublicApiError(response.status === 401 && errorCode === "AUTH_INVALID" ? 401 : 503, errorCode);
  }
  try {
    return await response.json();
  } catch {
    throw new PublicApiError(503, "STAGING_INVALID_RESPONSE");
  }
}

function restUrl(origin, table, params) {
  return origin + "/rest/v1/" + table + "?" + new URLSearchParams(params).toString();
}

export async function readStagingOperatorStatus(req, binding, fetchImpl) {
  const accessToken = readBearer(req.headers);
  const user = await fetchJson(fetchImpl, binding.origin + "/auth/v1/user", binding.anonKey, accessToken, "AUTH_INVALID");
  if (typeof user?.id !== "string" || !UUID.test(user.id)) {
    throw new PublicApiError(401, "AUTH_INVALID");
  }
  // Service credentials never reach the browser. Every privileged read is scoped using the verified user.
  const memberships = await fetchJson(fetchImpl, restUrl(binding.origin, "x1_tenant_memberships", {
    select: "tenant_id,role,status",
    user_id: "eq." + user.id,
    status: "eq.ACTIVE",
    limit: "21"
  }), binding.serviceKey, binding.serviceKey, "STAGING_MEMBERSHIP_UNAVAILABLE");
  if (!Array.isArray(memberships)) throw new PublicApiError(503, "STAGING_INVALID_RESPONSE");
  if (memberships.length === 0) throw new PublicApiError(403, "NO_ACTIVE_TENANT_MEMBERSHIP");
  const wantedTenant = req.headers?.["x-x1-tenant-id"];
  if (wantedTenant && (typeof wantedTenant !== "string" || !UUID.test(wantedTenant))) {
    throw new PublicApiError(403, "TENANT_SCOPE_DENIED");
  }
  if (!wantedTenant && memberships.length !== 1) {
    throw new PublicApiError(409, "TENANT_SELECTION_REQUIRED");
  }
  const membership = wantedTenant
    ? memberships.find((m) => m.tenant_id?.toLowerCase() === wantedTenant.toLowerCase() && m.status === "ACTIVE")
    : memberships[0];
  if (!membership || !UUID.test(membership.tenant_id ?? "")) {
    throw new PublicApiError(403, "TENANT_SCOPE_DENIED");
  }
  if (!OPERATOR_ROLES.has(membership.role)) {
    throw new PublicApiError(403, "ROLE_NOT_PERMITTED");
  }
  const tenants = await fetchJson(fetchImpl, restUrl(binding.origin, "x1_tenants", {
    select: "tenant_id,status",
    tenant_id: "eq." + membership.tenant_id,
    status: "eq.ACTIVE",
    limit: "1"
  }), binding.serviceKey, binding.serviceKey, "STAGING_TENANT_UNAVAILABLE");
  if (!Array.isArray(tenants) || tenants.length !== 1) {
    throw new PublicApiError(403, "TENANT_NOT_ACTIVE");
  }
  // Bounded status sample, not a claim about total queue size. Never dispatch or mutate a queue job.
  const rows = await fetchJson(fetchImpl, restUrl(binding.origin, "x1_work_queue", {
    select: "status",
    tenant_id: "eq." + membership.tenant_id,
    order: "updated_at.desc",
    limit: "201"
  }), binding.serviceKey, binding.serviceKey, "STAGING_QUEUE_UNAVAILABLE");
  if (!Array.isArray(rows)) throw new PublicApiError(503, "STAGING_INVALID_RESPONSE");
  const counts = Object.fromEntries(QUEUE_STATUSES.map((s) => [s, 0]));
  for (const row of rows.slice(0, 200)) {
    if (typeof row?.status === "string" && row.status in counts) counts[row.status]++;
  }
  return {
    status: "STAGING_READ_VERIFIED",
    tenant_id: membership.tenant_id,
    role: membership.role,
    user_id: user.id,
    sample: { limit: 200, truncated: rows.length > 200, counts },
    dispatch: "DISABLED",
    writes: "DISABLED"
  };
}
