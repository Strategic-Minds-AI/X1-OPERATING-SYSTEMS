import { PublicApiError, resolveStagingBinding, respond } from "../../server/x1-staging.mjs";

export function runHealth(req, res, env = process.env) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return respond(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }
  const binding = resolveStagingBinding(env);
  if (!binding.ok) {
    return respond(res, 503, {
      service: "x1-staging-adapter",
      status: "UNBOUND",
      reason: binding.code,
      writes: "DISABLED",
      dispatch: "DISABLED"
    });
  }
  // Key presence is NOT proof that Auth or PostgREST works.
  return respond(res, 200, {
    service: "x1-staging-adapter",
    status: "CONFIGURED_NOT_VALIDATED",
    target: "X1_STAGING_ONLY",
    writes: "DISABLED",
    dispatch: "DISABLED"
  });
}

export async function runDeepHealth(req, res, { env = process.env, fetchImpl = fetch } = {}) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return respond(res, 405, { status: "METHOD_NOT_ALLOWED", writes: "DISABLED", dispatch: "DISABLED" });
  }
  const binding = resolveStagingBinding(env);
  if (!binding.ok) {
    return respond(res, 503, {
      service: "x1-staging-adapter",
      status: "UNBOUND",
      reason: binding.code,
      writes: "DISABLED",
      dispatch: "DISABLED"
    });
  }
  // Fixed, zero-row GET validates the server credential and table access without reading records.
  const url = binding.origin + "/rest/v1/x1_tenant_memberships?select=user_id&limit=0";
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        apikey: binding.serviceKey,
        authorization: "Bearer " + binding.serviceKey,
        accept: "application/json"
      },
      redirect: "error",
      signal: AbortSignal.timeout(6000)
    });
  } catch {
    throw new PublicApiError(503, "STAGING_UPSTREAM_UNAVAILABLE");
  }
  try { await response.body?.cancel(); } catch {}
  if (!response.ok) {
    return respond(res, 503, {
      service: "x1-staging-adapter",
      status: "STAGING_CONNECTION_UNVERIFIED",
      reason: "STAGING_DATABASE_UNAVAILABLE",
      target: "X1_STAGING_ONLY",
      writes: "DISABLED",
      dispatch: "DISABLED"
    });
  }
  return respond(res, 200, {
    service: "x1-staging-adapter",
    status: "STAGING_CONNECTION_VERIFIED",
    target: "X1_STAGING_ONLY",
    auth: "NOT_TESTED",
    database: "READ_ONLY_ZERO_ROW_PROBE_PASSED",
    writes: "DISABLED",
    dispatch: "DISABLED"
  });
}

export default async function handler(req, res) {
  if (req.query?.deep === "1") {
    try {
      return await runDeepHealth(req, res);
    } catch {
      return respond(res, 503, {
        service: "x1-staging-adapter",
        status: "STAGING_CONNECTION_UNVERIFIED",
        reason: "STAGING_UPSTREAM_UNAVAILABLE",
        target: "X1_STAGING_ONLY",
        writes: "DISABLED",
        dispatch: "DISABLED"
      });
    }
  }
  return runHealth(req, res);
}
