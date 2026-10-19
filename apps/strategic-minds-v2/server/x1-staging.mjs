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

export function resolveStagingUserBinding(env = {}) {
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
  if (!env.SUPABASE_ANON_KEY) {
    return { ok: false, code: "MISSING_SERVER_CREDENTIALS" };
  }
  return { ok: true, origin: candidate.origin, anonKey: env.SUPABASE_ANON_KEY };
}

export function resolveStagingBinding(env = {}) {
  const userBinding = resolveStagingUserBinding(env);
  if (!userBinding.ok) return userBinding;
  // Keep privileged Vercel routes fail-closed until a verified staging service key is configured.
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { ok: false, code: "MISSING_SERVER_CREDENTIALS" };
  return { ...userBinding, serviceKey };
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
    throw new PublicApiError((response.status === 401 || response.status === 403) && errorCode === "AUTH_INVALID" ? 401 : 503, errorCode);
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

  const wantedTenant = req.headers?.["x-x1-tenant-id"] ?? req.headers?.["X-X1-Tenant-ID"] ?? null;
  if (wantedTenant && (typeof wantedTenant !== "string" || !UUID.test(wantedTenant))) {
    throw new PublicApiError(403, "TENANT_SCOPE_DENIED");
  }

  // The staging RPC checks auth.uid(), active membership, role, and tenant state under a
  // tightly scoped SECURITY DEFINER function. The caller token is forwarded; no service key
  // is needed for this read-only operator-status path.
  let response;
  try {
    response = await fetchImpl(binding.origin + "/rest/v1/rpc/x1_read_operator_status", {
      method: "POST",
      headers: {
        apikey: binding.anonKey,
        authorization: "Bearer " + accessToken,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({ p_tenant_id: wantedTenant || null }),
      redirect: "error",
      signal: AbortSignal.timeout(6000)
    });
  } catch {
    throw new PublicApiError(503, "STAGING_UPSTREAM_UNAVAILABLE");
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new PublicApiError(401, "AUTH_INVALID");
    }
    throw new PublicApiError(503, "STAGING_STATUS_UNAVAILABLE");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new PublicApiError(503, "STAGING_INVALID_RESPONSE");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new PublicApiError(503, "STAGING_INVALID_RESPONSE");
  }
  if (result.status === "STAGING_READ_VERIFIED") return result;

  const reason = typeof result.reason === "string" ? result.reason : "STAGING_STATUS_UNAVAILABLE";
  const statusByReason = {
    AUTHENTICATION_REQUIRED: 401,
    NO_ACTIVE_TENANT_MEMBERSHIP: 403,
    ROLE_NOT_PERMITTED: 403,
    TENANT_SCOPE_DENIED: 403,
    TENANT_NOT_ACTIVE: 403,
    TENANT_SELECTION_REQUIRED: 409,
    STAGING_QUEUE_UNAVAILABLE: 503
  };
  throw new PublicApiError(statusByReason[reason] ?? 503, reason);
}
