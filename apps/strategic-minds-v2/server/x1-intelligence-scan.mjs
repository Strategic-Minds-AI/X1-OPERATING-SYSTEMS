import { PublicApiError, readStagingOperatorStatus, resolveStagingBinding, respond } from "./x1-staging.mjs";

const SOURCE = "github_repository";
const MAX_RESULTS = 25;
const DEFAULT_QUERY = "stars:>1000 pushed:>2025-01-01";
const MAX_QUERY = 180;
const ALLOWED_QUERY = /^[a-zA-Z0-9_ .:><=+\-\/()\[\]{}"]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateScanInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const query = typeof input.query === "string" && input.query.trim() ? input.query.trim() : DEFAULT_QUERY;
  const limit = Number.isInteger(input.limit) ? input.limit : 15;
  if (query.length > MAX_QUERY || !ALLOWED_QUERY.test(query) || /(?:token|password|secret|org:Strategic-Minds-AI)/i.test(query)) {
    return { ok: false, code: "GITHUB_QUERY_INVALID" };
  }
  if (limit < 1 || limit > MAX_RESULTS) return { ok: false, code: "GITHUB_LIMIT_INVALID" };
  return { ok: true, value: { query, limit } };
}

export function normalizeRepository(repo) {
  const fullName = typeof repo?.full_name === "string" ? repo.full_name.trim() : "";
  let url;
  try { url = new URL(repo?.html_url); } catch { return null; }
  if (!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(fullName) ||
      url.origin !== "https://github.com" || url.pathname.toLowerCase() !== "/" + fullName.toLowerCase()) return null;
  const pushedAt = typeof repo.pushed_at === "string" && Number.isFinite(Date.parse(repo.pushed_at)) ? new Date(repo.pushed_at).toISOString() : null;
  const updatedAt = typeof repo.updated_at === "string" && Number.isFinite(Date.parse(repo.updated_at)) ? new Date(repo.updated_at).toISOString() : null;
  return {
    source: SOURCE,
    external_id: fullName.toLowerCase(),
    title: fullName.slice(0, 200),
    summary: String(repo.description || "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 500),
    url: url.toString(),
    stars: Number.isSafeInteger(repo.stargazers_count) && repo.stargazers_count >= 0 ? repo.stargazers_count : 0,
    forks: Number.isSafeInteger(repo.forks_count) && repo.forks_count >= 0 ? repo.forks_count : 0,
    open_issues: Number.isSafeInteger(repo.open_issues_count) && repo.open_issues_count >= 0 ? repo.open_issues_count : 0,
    language: typeof repo.language === "string" ? repo.language.slice(0, 80) : null,
    pushed_at: pushedAt,
    upstream_updated_at: updatedAt,
    metadata: { archived: Boolean(repo.archived), fork: Boolean(repo.fork), default_branch: String(repo.default_branch || "main").slice(0, 100) }
  };
}

function bodyOf(req) {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) return req.body;
  if (typeof req.body === "string" && req.body.length <= 4000) {
    try { const body = JSON.parse(req.body); if (body && typeof body === "object" && !Array.isArray(body)) return body; } catch {}
  }
  return {};
}
function tableUrl(binding, params) {
  return binding.origin + "/rest/v1/x1_intelligence_ingest?" + new URLSearchParams(params).toString();
}
async function rest(binding, fetchImpl, url, { method = "GET", body, prefer } = {}) {
  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers: {
        apikey: binding.serviceKey,
        authorization: "Bearer " + binding.serviceKey,
        accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}),
        ...(prefer ? { Prefer: prefer } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(7000)
    });
  } catch { throw new PublicApiError(503, "INTELLIGENCE_STORAGE_UNAVAILABLE"); }
  if (!response.ok) throw new PublicApiError(503, "INTELLIGENCE_STORAGE_REJECTED");
  try { const data = await response.json(); if (!Array.isArray(data)) throw Error("rows"); return data; }
  catch { throw new PublicApiError(503, "INTELLIGENCE_STORAGE_INVALID"); }
}
async function searchGitHub(query, limit, env, fetchImpl) {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "X1-Native-Intelligence-Ingest" };
  if (typeof env.X1_GITHUB_SCAN_TOKEN === "string" && env.X1_GITHUB_SCAN_TOKEN.length >= 20) {
    headers.Authorization = "Bearer " + env.X1_GITHUB_SCAN_TOKEN;
  }
  let response;
  try { response = await fetchImpl(url.toString(), { headers, redirect: "error", signal: AbortSignal.timeout(12000) }); }
  catch { throw new PublicApiError(503, "GITHUB_UPSTREAM_UNAVAILABLE"); }
  if (!response.ok) throw new PublicApiError(503, response.status === 403 || response.status === 429 ? "GITHUB_RATE_LIMITED" : "GITHUB_UPSTREAM_REJECTED");
  let data;
  try { data = await response.json(); } catch { throw new PublicApiError(503, "GITHUB_RESPONSE_INVALID"); }
  if (!Array.isArray(data?.items)) throw new PublicApiError(503, "GITHUB_RESPONSE_INVALID");
  return data.items.map(normalizeRepository).filter(Boolean).slice(0, limit);
}

export async function runIntelligenceScan(req, res, { env = process.env, fetchImpl = fetch } = {}) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return respond(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }
  try {
    const binding = resolveStagingBinding(env);
    if (!binding.ok) return respond(res, 503, { status: "UNBOUND", reason: binding.code });
    const operator = await readStagingOperatorStatus(req, binding, fetchImpl);
    if (!["OWNER", "ADMIN", "BUILDER"].includes(operator.role)) throw new PublicApiError(403, "INTELLIGENCE_ROLE_REQUIRED");

    if (req.method === "GET") {
      const rows = await rest(binding, fetchImpl, tableUrl(binding, {
        select: "ingest_id,source,external_id,title,summary,url,stars,forks,open_issues,language,pushed_at,upstream_updated_at,metadata,first_seen_at,last_seen_at",
        tenant_id: "eq." + operator.tenant_id,
        source: "eq." + SOURCE,
        order: "stars.desc,last_seen_at.desc",
        limit: String(MAX_RESULTS)
      }));
      return respond(res, 200, { status: "INTELLIGENCE_READ_VERIFIED", tenant_id: operator.tenant_id, items: rows });
    }

    const parsed = validateScanInput(bodyOf(req));
    if (!parsed.ok) return respond(res, 400, { status: "INVALID_INPUT", reason: parsed.code });
    const repos = await searchGitHub(parsed.value.query, parsed.value.limit, env, fetchImpl);
    if (!repos.length) return respond(res, 200, { status: "INTELLIGENCE_SCAN_COMPLETE", tenant_id: operator.tenant_id, discovered: 0, stored: 0, items: [] });

    const now = new Date().toISOString();
    const records = repos.map(repo => ({
      tenant_id: operator.tenant_id,
      ...repo,
      last_seen_at: now,
      created_by: operator.user_id
    }));
    const stored = await rest(binding, fetchImpl, tableUrl(binding, {
      on_conflict: "tenant_id,source,external_id",
      select: "ingest_id,source,external_id,title,url,stars,last_seen_at"
    }), { method: "POST", body: records, prefer: "resolution=merge-duplicates,return=representation" });
    return respond(res, 200, {
      status: "INTELLIGENCE_SCAN_COMPLETE",
      tenant_id: operator.tenant_id,
      discovered: repos.length,
      stored: stored.length,
      query: parsed.value.query,
      items: stored
    });
  } catch (error) {
    if (error instanceof PublicApiError) return respond(res, error.status, { status: "BLOCKED", reason: error.code });
    return respond(res, 503, { status: "BLOCKED", reason: "INTELLIGENCE_SCAN_UNAVAILABLE" });
  }
}
