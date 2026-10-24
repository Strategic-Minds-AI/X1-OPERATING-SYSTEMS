import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../src/OAuthConsent.jsx', import.meta.url), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('X1 staging consent route is reachable through Vercel SPA rewrite', () => {
  assert.match(route, /path="\/oauth\/consent"/);
  assert.ok(vercel.rewrites.some(x => x.source === '/oauth/:path*' && x.destination === '/index.html'));
});

test('X1 consent requires user review; never silently approves', () => {
  assert.match(screen, /getAuthorizationDetails\(authorizationId\)/);
  assert.match(screen, /approveAuthorization\(authorizationId\)/);
  assert.match(screen, /denyAuthorization\(authorizationId\)/);
  assert.match(screen, /onClick=\{\(\)=>decide\('approve'\)\}/);
  assert.match(screen, /onClick=\{\(\)=>decide\('deny'\)\}/);
  assert.match(screen, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(screen, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
