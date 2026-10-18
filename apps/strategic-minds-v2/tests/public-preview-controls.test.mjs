import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/V2Experience.jsx', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('approved Design B has no public QA strip or design-selection controls', () => {
  assert.doesNotMatch(source, /v2-variant-switch|NOINDEX\s*·\s*DESIGN PREVIEW|Design preview selection/);
  assert.doesNotMatch(source, /switch_preview|Design Preview\s*['"+]/);
  assert.doesNotMatch(source, /\bVARIANTS\b/);
});
test('customer page has approved brand title, keeps SEO preview noindex and variant routes', () => {
  assert.match(source, /Strategic Minds AI \| Intelligence in Motion/);
  assert.match(source, /meta\.content='noindex,nofollow,noarchive'/);
  assert.match(html, /noindex,nofollow/);
  assert.match(main, /\/v2\/b/);
  assert.match(source, /variant==='b'\?<LongPage/);
});
