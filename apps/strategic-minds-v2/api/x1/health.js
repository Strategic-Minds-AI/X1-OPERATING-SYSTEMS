import { resolveStagingBinding, respond } from "../../server/x1-staging.mjs";

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

export default function handler(req, res) {
  return runHealth(req, res);
}
