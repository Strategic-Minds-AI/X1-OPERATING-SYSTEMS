import test from "node:test";
import assert from "node:assert/strict";
import { STAGING_ORIGIN, resolveStagingBinding, resolveStagingUserBinding } from "../server/x1-staging.mjs";
import { runHealth, runDeepHealth } from "../api/x1/health.js";
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
    calls.push({ url, method: settings.method, headers: settings.headers, body: settings.body });
    const u = new URL(url);
    assert.equal(u.origin, STAGING_ORIGIN);
    if (u.pathname === "/auth/v1/user") {
      assert.equal(settings.method, "GET");
      assert.equal(settings.headers.apikey, VALID.SUPABASE_ANON_KEY);
      assert.equal(settings.headers.authorization, "Bearer fake-jwt");
      return opts.invalidToken ? reply({ error: "bad-jwt" }, opts.invalidTokenStatus ?? 403) : reply({ id: USER });
    }
    assert.equal(u.pathname, "/rest/v1/rpc/x1_read_operator_status");
    assert.equal(settings.method, "POST");
    assert.equal(settings.headers.apikey, VALID.SUPABASE_ANON_KEY);
    assert.equal(settings.headers.authorization, "Bearer fake-jwt");
    const body = JSON.parse(settings.body);
    const wantedTenant = body.p_tenant_id;
    if (opts.rpcResponse) return reply(opts.rpcResponse);
    if (opts.memberships && opts.memberships.length === 0) {
      return reply({ status: "BLOCKED", reason: "NO_ACTIVE_TENANT_MEMBERSHIP" });
    }
    if (opts.memberships && opts.memberships.length > 1 && !wantedTenant) {
      return reply({ status: "BLOCKED", reason: "TENANT_SELECTION_REQUIRED" });
    }
    if (wantedTenant && wantedTenant !== TENANT_A) {
      return reply({ status: "BLOCKED", reason: "TENANT_SCOPE_DENIED" });
    }
    const role = opts.memberships?.[0]?.role ?? "OWNER";
    if (!["OWNER", "ADMIN", "BUILDER", "VALIDATOR"].includes(role)) {
      return reply({ status: "BLOCKED", reason: "ROLE_NOT_PERMITTED" });
    }
    if (opts.suspendedTenant) return reply({ status: "BLOCKED", reason: "TENANT_NOT_ACTIVE" });
    if (opts.queueUnavailable) return reply({ status: "BLOCKED", reason: "STAGING_QUEUE_UNAVAILABLE" });
    return reply({
      status: "STAGING_READ_VERIFIED",
      tenant_id: TENANT_A,
      role,
      user_id: USER,
      sample: { limit: 200, truncated: false, counts: {
        PENDING: 0, LEASED: 0, COMPLETED: 2, FAILED: 0, BLOCKED: 1, DEAD_LETTER: 0
      }},
      dispatch: "DISABLED",
      writes: "DISABLED"
    });
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
  assert.equal(resolveStagingUserBinding({ VERCEL_ENV: "preview", SUPABASE_URL: STAGING_ORIGIN, SUPABASE_ANON_KEY: "public" }).ok, true);
  assert.equal(resolveStagingUserBinding({ ...common, VERCEL_ENV: "production" }).ok, false);
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
  assert.equal(client.calls.length, 2);
  assert.equal(client.calls[1].url.includes("/rpc/x1_read_operator_status"), true);
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


test("deep health verifies only a zero-row staging read and never returns credentials", async () => {
  const response = res();
  let seenUrl = "";
  let seenSettings;
  const fetchImpl = async (url, settings) => {
    seenUrl = url;
    seenSettings = settings;
    return reply([]);
  };
  await runDeepHealth(req(), response, { env: VALID, fetchImpl });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "STAGING_CONNECTION_VERIFIED");
  assert.equal(response.body.database, "READ_ONLY_ZERO_ROW_PROBE_PASSED");
  assert.equal(response.body.writes, "DISABLED");
  assert.equal(response.body.dispatch, "DISABLED");
  assert.equal(seenUrl, STAGING_ORIGIN + "/rest/v1/x1_tenant_memberships?select=user_id&limit=0");
  assert.equal(seenSettings.method, "GET");
  assert.equal(seenSettings.headers.apikey, VALID.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(seenSettings.headers.authorization, "Bearer " + VALID.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(JSON.stringify(response.body).includes(VALID.SUPABASE_SERVICE_ROLE_KEY), false);
});
test("deep health fails closed on invalid staging bindings", async () => {
  const response = res();
  let calls = 0;
  await runDeepHealth(req(), response, {
    env: { ...VALID, SUPABASE_URL: "https://vgsmyhqqtkkluhypxyua.supabase.co" },
    fetchImpl: async () => { calls++; return reply([]); }
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.reason, "NON_STAGING_TARGET");
  assert.equal(calls, 0);
});
test("deep health hides database credential failures and rejects write methods", async () => {
  const failed = res();
  await runDeepHealth(req(), failed, {
    env: VALID,
    fetchImpl: async () => reply({ code: "invalid-api-key" }, 401)
  });
  assert.equal(failed.statusCode, 503);
  assert.equal(failed.body.reason, "STAGING_DATABASE_UNAVAILABLE");
  const method = res();
  let calls = 0;
  await runDeepHealth(req({}, "POST"), method, {
    env: VALID,
    fetchImpl: async () => { calls++; return reply([]); }
  });
  assert.equal(method.statusCode, 405);
  assert.equal(calls, 0);
});


test("operator status works without a Vercel service-role key via staging RPC", async () => {
  const response = res();
  const client = fakeSupabase();
  const { SUPABASE_SERVICE_ROLE_KEY, ...publicOnlyEnv } = VALID;
  await runOperatorStatus(req({ authorization: "Bearer fake-jwt" }), response, {
    env: publicOnlyEnv, fetchImpl: client.fetchImpl
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "STAGING_READ_VERIFIED");
  assert.equal(client.calls[1].url.includes("/rpc/x1_read_operator_status"), true);
  assert.equal(client.calls[1].headers.authorization, "Bearer fake-jwt");
  assert.equal(client.calls[1].headers.apikey, VALID.SUPABASE_ANON_KEY);
});
