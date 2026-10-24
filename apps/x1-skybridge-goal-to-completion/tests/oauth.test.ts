import test from "node:test";
import assert from "node:assert/strict";
import { stagingOAuth } from "../src/oauth.js";

test("development does not enable an unconfigured public OAuth server", () => {
  const saved = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "development";
    assert.equal(stagingOAuth(), undefined);
  } finally {
    if (saved === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = saved;
  }
});

test("production refuses to start without staging authorization configuration", () => {
  const keys = ["NODE_ENV","X1_STAGING_ONLY","X1_ALLOWED_TENANT_ID","X1_SUPABASE_PUBLISHABLE_KEY","X1_MCP_SERVER_URL"];
  const saved = Object.fromEntries(keys.map(k => [k,process.env[k]]));
  try {
    process.env.NODE_ENV = "production";
    for (const key of keys.slice(1)) delete process.env[key];
    assert.throws(() => stagingOAuth(), /X1_AUTH_CONFIGURATION_REQUIRED/);
    process.env.X1_STAGING_ONLY="true";
    process.env.X1_ALLOWED_TENANT_ID="not-a-uuid";
    process.env.X1_SUPABASE_PUBLISHABLE_KEY="public-test-placeholder";
    process.env.X1_MCP_SERVER_URL="http://localhost:3000";
    assert.throws(() => stagingOAuth(), /X1_AUTH_CONFIGURATION_REQUIRED/);
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});

test("invalid JWT is a typed OAuth invalid_token error, not an uncaught 500", async () => {
  const keys = ["NODE_ENV","X1_STAGING_ONLY","X1_ALLOWED_TENANT_ID","X1_SUPABASE_PUBLISHABLE_KEY","X1_MCP_SERVER_URL"];
  const prior = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    process.env.NODE_ENV = "production";
    process.env.X1_STAGING_ONLY = "true";
    process.env.X1_ALLOWED_TENANT_ID = "666f23bf-61bd-4be0-b5cb-4872e04fad9b";
    process.env.X1_SUPABASE_PUBLISHABLE_KEY = "public-test-value";
    process.env.X1_MCP_SERVER_URL = "https://mcp-staging.example.com";
    const oauth = stagingOAuth();
    assert.ok(oauth);
    await assert.rejects(
      () => oauth.verifier.verifyAccessToken("x.fake.signature"),
      error => error && error.code === "invalid_token"
    );
  } finally {
    for (const k of keys) {
      if (prior[k] === undefined) delete process.env[k];
      else process.env[k] = prior[k];
    }
  }
});
