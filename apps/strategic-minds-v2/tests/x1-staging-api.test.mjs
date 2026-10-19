import test from "node:test";
import assert from "node:assert/strict";
import { STAGING_ORIGIN, resolveStagingBinding } from "../server/x1-staging.mjs";
import { runHealth } from "../api/x1/health.js";
import { runOperatorStatus } from "../api/x1/operator-status.js";

const USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TENANT_B = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VALID = {
  VERCEL_ENV: "preview",
  SUPABASE_URL: STAGING_ORIGIN + "/",
  SUPABASE_ANON_KEY: "test-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-server-key"
};

function res() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    end(s) { this.body = JSON.parse(s); }
  };
}
function req(headers = {}, method = "GET") { return { method, headers }; }
function reply(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
function fakeSupabase(opts = {}) {
  const calls = [];
  const fetchImpl = async (url, settings) => {
    calls.push({ url, method: settings.method, headers: settings.headers });
    const u = new URL(url);
    assert.equal(u.origin, STAGING_ORIGIN);
    assert.equal(settings.method, "GET");
    if (u.pathname === "/auth/v1/user") {
      assert.equal(settings.headers.apikey, VALID.SUPABASE_ANON_KEY);
      assert.equal(settings.headers.authorization, "Bearer fake-jwt");
      return opts.invalidToken ? reply({ error: "bad-jwt" }, opts.invalidTokenStatus ?? 403) : reply({ id: USER });
    }
    assert.equal(settings.headers.apikey, VALID.SUPABASE_SERVICE_ROLE_KEY);
    assert.equal(settings.headers.authorization, "Bearer " + VALID.SUPABASE_SERVICE_ROLE_KEY);
    if (u.pathname === "/rest/v1/x1_tenant_memberships") {
      assert.equal(u.searchParams.get("user_id"), "eq." + USER);
      assert.equal(u.searchParams.get("status"), "eq.ACTIVE");
      return reply(opts.memberships ?? [{ tenant_id: TENANT_A, role: "OWNER", status: "ACTIVE" }]);
    }
    if (u.pathname === "/rest/v1/x1_tenants") {
      assert.equal(u.searchParams.get("tenant_id"), "eq." + (opts.wantTenant ?? TENANT_A));
      return reply(opts.suspendedTenant ? [] : [{ tenant_id: opts.wantTenant ?? TENANT_A, status: "ACTIVE" }]);
    }
    if (u.pathname === "/rest/v1/x1_work_queue") {
      assert.equal(u.searchParams.get("tenant_id"), "eq." + (opts.wantTenant ?? TENANT_A));
      if (opts.queueUnavailable) return reply({ error: "not-ready" }, 503);
      return reply(opts.jobs ?? [{ status: "COMPLETED" }, { status: "BLOCKED" }, { status: "COMPLETED" }]);
    }
    throw new Error("Unexpected endpoint " + u.pathname);
  };
  return { fetchImpl, calls };
}

test("existing provider-managed staging secret alias stays preview-only", () => {
  const { SUPABASE_SERVICE_ROLE_KEY, ...common } = VALID;
  const alias = { ...common, SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_ROLE_KEY };
  assert.equal(resolveStagingBinding(alias).ok, true);
  assert.equal(resolveStagingBinding(alias).serviceKey, SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(resolveStagingBinding({ ...alias, VERCEL_ENV: "production" }).ok, false);
  assert.equal(resolveStagingBinding({ ...alias, SUPABASE_URL: "https://other.supabase.co" }).ok, false);
});
test("missing preview environment fails closed", () => {
  assert.deepEqual(resolveStagingBinding({ ...VALID, VERCEL_ENV: "production" }), {
    ok: false, code: "NON_PREVIEW_RUNTIME"
  });
});
test("production or wrong Supabase URL cannot be used", () => {
  for (const url of [
    "https://vgsmyhqqtkkluhypxyua.supabase.co",
    "https://other.supabase.co",
    "https://uvdkzsbjackpjvpoxtyk.supabase.co.evil.invalid",
    "http://uvdkzsbjackpjvpoxtyk.supabase.co",
    STAGING_ORIGIN + "/rest/v1",
    STAGING_ORIGIN + "/?unsafe=1"
  ]) {
    assert.equal(resolveStagingBinding({ ...VALID, SUPABASE_URL: url }).ok, false, url);
  }
});
test("health does not claim database access from key presence alone", () => {
  const response = res();
  runHealth(req(), response, VALID);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "CONFIGURED_NOT_VALIDATED");
  assert.equal(response.body.dispatch, "DISABLED");
  assert.equal(response.body.writes, "DISABLED");
  assert.equal(response.headers["Cache-Control"].includes("no-store"), true);
  assert.equal(JSON.stringify(response.body).includes(VALID.SUPABASE_SERVICE_ROLE_KEY), false);
});
test("health blocks missing bindings and write methods", () => {
  const a = res();
  runHealth(req(), a, { VERCEL_ENV: "preview" });
  assert.equal(a.statusCode, 503);
  assert.equal(a.body.reason, "MISSING_STAGING_BINDING");
  const b = res();
  runHealth(req({}, "POST"), b, VALID);
  assert.equal(b.statusCode, 405);
});
test("operator status requires a user access token, not service credentials", async () => {
  const response = res();
  const client = fakeSupabase();
  await runOperatorStatus(req(), response, { env: VALID, fetchImpl: client.fetchImpl });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.reason, "AUTHENTICATION_REQUIRED");
  assert.equal(client.calls.length, 0);
});
test("forged or expired access token is rejected by Supabase Auth", async () => {
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, {
    env: VALID, fetchImpl: fakeSupabase({ invalidToken: true, invalidTokenStatus: 403 }).fetchImpl
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.reason, "AUTH_INVALID");
});
test("no active membership denies access before queue lookup", async () => {
  const client = fakeSupabase({ memberships: [] });
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, { env: VALID, fetchImpl: client.fetchImpl });
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.reason, "NO_ACTIVE_TENANT_MEMBERSHIP");
  assert.equal(client.calls.some(c => c.url.includes("x1_work_queue")), false);
});
test("viewer cannot inspect X1 operator queue", async () => {
  const client = fakeSupabase({ memberships: [{ tenant_id: TENANT_A, role: "VIEWER", status: "ACTIVE" }] });
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, { env: VALID, fetchImpl: client.fetchImpl });
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.reason, "ROLE_NOT_PERMITTED");
});
test("cross-tenant header cannot switch access", async () => {
  const client = fakeSupabase();
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt", "x-x1-tenant-id": TENANT_B }), response, {
    env: VALID, fetchImpl: client.fetchImpl
  });
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.reason, "TENANT_SCOPE_DENIED");
  assert.equal(client.calls.some(c => c.url.includes("x1_work_queue")), false);
});
test("multi-tenant operators must explicitly choose an authorized tenant", async () => {
  const members = [
    { tenant_id: TENANT_A, role: "OWNER", status: "ACTIVE" },
    { tenant_id: TENANT_B, role: "ADMIN", status: "ACTIVE" }
  ];
  const client = fakeSupabase({ memberships: members });
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, { env: VALID, fetchImpl: client.fetchImpl });
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.reason, "TENANT_SELECTION_REQUIRED");
});
test("authorized operator reads only selected tenant in staging, without dispatching jobs", async () => {
  const client = fakeSupabase();
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, { env: VALID, fetchImpl: client.fetchImpl });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "STAGING_READ_VERIFIED");
  assert.equal(response.body.tenant_id, TENANT_A);
  assert.deepEqual(response.body.sample.counts, {
    PENDING: 0, LEASED: 0, COMPLETED: 2, FAILED: 0, BLOCKED: 1, DEAD_LETTER: 0
  });
  assert.equal(response.body.dispatch, "DISABLED");
  assert.equal(response.body.writes, "DISABLED");
  assert.equal(client.calls.every(c => c.method === "GET"), true);
  assert.equal(JSON.stringify(response.body).includes(VALID.SUPABASE_SERVICE_ROLE_KEY), false);
});
test("upstream queue failure is fail-closed with no private error details", async () => {
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, {
    env: VALID, fetchImpl: fakeSupabase({ queueUnavailable: true }).fetchImpl
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.reason, "STAGING_QUEUE_UNAVAILABLE");
});
test("operator route never reads a production database", async () => {
  const client = fakeSupabase();
  const response = res();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, {
    env: { ...VALID, SUPABASE_URL: "https://vgsmyhqqtkkluhypxyua.supabase.co" },
    fetchImpl: client.fetchImpl
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.reason, "NON_STAGING_TARGET");
  assert.equal(client.calls.length, 0);
});
test("operator route disallows POST and all queue mutations", async () => {
  const response = res();
  const client = fakeSupabase();
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }, "POST"), response, {
    env: VALID, fetchImpl: client.fetchImpl
  });
  assert.equal(response.statusCode, 405);
  assert.equal(client.calls.length, 0);
});
