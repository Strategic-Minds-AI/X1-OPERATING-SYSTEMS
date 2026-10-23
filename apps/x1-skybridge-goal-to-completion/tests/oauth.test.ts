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
