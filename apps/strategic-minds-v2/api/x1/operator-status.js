import {
  PublicApiError, readBearer, readStagingOperatorStatus, resolveStagingUserBinding, respond
} from "../../server/x1-staging.mjs";

export async function runOperatorStatus(req, res, { env = process.env, fetchImpl = fetch } = {}) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return respond(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }
  try {
    readBearer(req.headers);
    const binding = resolveStagingUserBinding(env);
    if (!binding.ok) return respond(res, 503, { status: "UNBOUND", reason: binding.code });
    const result = await readStagingOperatorStatus(req, binding, fetchImpl);
    return respond(res, 200, result);
  } catch (err) {
    if (err instanceof PublicApiError) {
      return respond(res, err.status, { status: "BLOCKED", reason: err.code });
    }
    return respond(res, 503, { status: "BLOCKED", reason: "STAGING_STATUS_UNAVAILABLE" });
  }
}

export default async function handler(req, res) {
  return runOperatorStatus(req, res);
}
