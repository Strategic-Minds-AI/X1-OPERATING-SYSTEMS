import { createHash, randomUUID } from "node:crypto";
import { PublicApiError, readBearer, resolveStagingBinding, respond } from "./x1-staging.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = new Set(["OWNER", "ADMIN", "BUILDER", "VALIDATOR"]);
const STATUSES = new Set(["PENDING", "LEASED", "COMPLETED", "FAILED", "BLOCKED", "DEAD_LETTER"]);
const MAX_ITEMS = 100;

export function validateWorkItemInput(input) {
  const body = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "engineering";
  const criteria = Array.isArray(body.acceptanceCriteria)
    ? body.acceptanceCriteria.filter(x => typeof x === "string").map(x => x.trim()).filter(Boolean).slice(0, 8)
    : [];
  if (title.length < 3 || title.length > 120) return { ok: false, code: "TITLE_LENGTH_INVALID" };
  if (description.length < 10 || description.length > 4000) return { ok: false, code: "DESCRIPTION_LENGTH_INVALID" };
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/i.test(category)) return { ok: false, code: "CATEGORY_INVALID" };
  if (criteria.some(x => x.length > 240)) return { ok: false, code: "ACCEPTANCE_CRITERION_TOO_LONG" };
  return { ok: true, value: { title, description, category, acceptanceCriteria: criteria } };
}

function urlFor(origin, path, params = {}) {
  return origin + path + "?" + new URLSearchParams(params).toString();
}
async function requestJson(fetchImpl, url, { method = "GET", key, bearer, body, prefer } = {}) {
  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers: {
        apikey: key,
        authorization: "Bearer " + bearer,
        accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}),
        ...(prefer ? { prefer } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(7000)
    });
  } catch {
    throw new PublicApiError(503, "STAGING_UPSTREAM_UNAVAILABLE");
  }
  if (!response.ok) {
    if (response.status === 401) throw new PublicApiError(401, "AUTH_INVALID");
    throw new PublicApiError(response.status === 409 ? 409 : 503, "STAGING_WORK_ITEM_UPSTREAM_REJECTED");
  }
  try { return await response.json(); }
  catch { throw new PublicApiError(503, "STAGING_INVALID_RESPONSE"); }
}
async function resolveOperator(req, binding, fetchImpl) {
  const token = readBearer(req.headers);
  const user = await requestJson(fetchImpl, binding.origin + "/auth/v1/user", { key: binding.anonKey, bearer: token });
  if (typeof user?.id !== "string" || !UUID.test(user.id)) throw new PublicApiError(401, "AUTH_INVALID");
  const memberships = await requestJson(fetchImpl, urlFor(binding.origin, "/rest/v1/x1_tenant_memberships", {
    select: "tenant_id,role,status", user_id: "eq." + user.id, status: "eq.ACTIVE", limit: "21"
  }), { key: binding.serviceKey, bearer: binding.serviceKey });
  if (!Array.isArray(memberships) || !memberships.length) throw new PublicApiError(403, "NO_ACTIVE_TENANT_MEMBERSHIP");
  const wanted = req.headers?.["x-x1-tenant-id"];
  if (wanted && !UUID.test(wanted)) throw new PublicApiError(403, "TENANT_SCOPE_DENIED");
  if (!wanted && memberships.length !== 1) throw new PublicApiError(409, "TENANT_SELECTION_REQUIRED");
  const membership = wanted
    ? memberships.find(m => m.tenant_id?.toLowerCase() === wanted.toLowerCase() && m.status === "ACTIVE")
    : memberships[0];
  if (!membership || !UUID.test(membership.tenant_id || "") || !ROLES.has(membership.role)) {
    throw new PublicApiError(403, "ROLE_OR_TENANT_SCOPE_DENIED");
  }
  const tenants = await requestJson(fetchImpl, urlFor(binding.origin, "/rest/v1/x1_tenants", {
    select: "tenant_id,status", tenant_id: "eq." + membership.tenant_id, status: "eq.ACTIVE", limit: "1"
  }), { key: binding.serviceKey, bearer: binding.serviceKey });
  if (!Array.isArray(tenants) || tenants.length !== 1) throw new PublicApiError(403, "TENANT_NOT_ACTIVE");
  return { user, tenantId: membership.tenant_id, role: membership.role, token };
}
function safeRow(row) {
  const p = row?.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    id: row.task_id,
    workPacketId: row.work_packet_id,
    missionId: row.mission_id,
    title: typeof p.title === "string" ? p.title : row.task_id,
    description: typeof p.description === "string" ? p.description : "",
    category: typeof p.category === "string" ? p.category : "engineering",
    acceptanceCriteria: Array.isArray(p.acceptanceCriteria) ? p.acceptanceCriteria : [],
    status: STATUSES.has(row.status) ? row.status : "BLOCKED",
    actionClass: row.action_class,
    priority: row.priority,
    attempts: row.attempts,
    lastErrorCode: row.last_error_code || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function runWorkItems(req, res, { env = process.env, fetchImpl = fetch } = {}) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return respond(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }
  try {
    const binding = resolveStagingBinding(env);
    if (!binding.ok) return respond(res, 503, { status: "UNBOUND", reason: binding.code });
    const operator = await resolveOperator(req, binding, fetchImpl);
    if (req.method === "POST" && !["OWNER", "ADMIN", "BUILDER"].includes(operator.role)) {
      throw new PublicApiError(403, "WORK_ITEM_WRITE_ROLE_REQUIRED");
    }
    if (req.method === "GET") {
      const rows = await requestJson(fetchImpl, urlFor(binding.origin, "/rest/v1/x1_work_queue", {
        select: "work_id,task_id,work_packet_id,mission_id,status,action_class,priority,attempts,last_error_code,created_at,updated_at,payload",
        tenant_id: "eq." + operator.tenantId,
        order: "updated_at.desc",
        limit: String(MAX_ITEMS)
      }), { key: binding.serviceKey, bearer: binding.serviceKey });
      if (!Array.isArray(rows)) throw new PublicApiError(503, "STAGING_INVALID_RESPONSE");
      return respond(res, 200, {
        status: "STAGING_QUEUE_READ_VERIFIED",
        tenant_id: operator.tenantId,
        role: operator.role,
        items: rows.map(safeRow),
        dispatch: "NOT_DISPATCHED_BY_API",
        source: "SUPABASE_STAGING_QUEUE"
      });
    }
    const parsed = validateWorkItemInput(req.body);
    if (!parsed.ok) return respond(res, 400, { status: "INVALID_INPUT", reason: parsed.code });
    const id = randomUUID();
    const taskId = "task-" + id;
    const workPacketId = "wp-" + id;
    const missionId = "kanban-" + id;
    const idempotencyKey = createHash("sha256").update(operator.tenantId + ":" + operator.user.id + ":" + id).digest("hex");
    const payload = {
      title: parsed.value.title,
      description: parsed.value.description,
      category: parsed.value.category,
      acceptanceCriteria: parsed.value.acceptanceCriteria,
      source: "x1-coding-kanban",
      approvalRequired: false,
      releaseGate: "independent-validation",
      dispatchPolicy: "draft-awaiting-authorized-build-worker"
    };
    const work = {
      tenant_id: operator.tenantId,
      work_packet_id: workPacketId,
      task_id: taskId,
      requested_by: operator.user.id,
      action_class: "DRAFT",
      required_capabilities: ["agent:smai:05-build", "agent:smai:07-qa"],
      payload,
      idempotency_key: idempotencyKey,
      priority: 100,
      max_attempts: 3,
      mission_id: missionId
    };
    // Use the canonical X1 enqueue RPC so idempotency and queue invariants are preserved.
    const workId = await requestJson(fetchImpl, binding.origin + "/rest/v1/rpc/x1_enqueue_work", {
      method: "POST",
      key: binding.serviceKey,
      bearer: binding.serviceKey,
      body: { p_work: work }
    });
    if (typeof workId !== "string" || !UUID.test(workId)) throw new PublicApiError(503, "STAGING_ENQUEUE_UNVERIFIED");
    const rows = await requestJson(fetchImpl, urlFor(binding.origin, "/rest/v1/x1_work_queue", {
      select: "work_id,task_id,work_packet_id,mission_id,status,action_class,priority,attempts,last_error_code,created_at,updated_at,payload",
      work_id: "eq." + workId,
      tenant_id: "eq." + operator.tenantId,
      limit: "1"
    }), { key: binding.serviceKey, bearer: binding.serviceKey });
    if (!Array.isArray(rows) || rows.length !== 1) throw new PublicApiError(503, "STAGING_ENQUEUE_READBACK_UNVERIFIED");
    return respond(res, 201, {
      status: "QUEUED_NOT_EXECUTED",
      item: safeRow(rows[0]),
      dispatch: "NOT_DISPATCHED_BY_API",
      message: "Saved as a DRAFT through the canonical X1 enqueue RPC. Current workers are read-only; no build or deployment is claimed."
    });
  } catch (err) {
    if (err instanceof PublicApiError) return respond(res, err.status, { status: "BLOCKED", reason: err.code });
    return respond(res, 503, { status: "BLOCKED", reason: "STAGING_WORK_QUEUE_UNAVAILABLE" });
  }
}
