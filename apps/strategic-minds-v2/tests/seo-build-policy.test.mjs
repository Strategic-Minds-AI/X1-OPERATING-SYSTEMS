import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareSeoBuild, renderRobots, renderSitemap, resolveSeoPolicy } from '../scripts/prepare-seo.mjs';

const approvedEnv = { X1_SEO_INDEXING_ENABLED: 'true', VITE_CANONICAL_SITE_URL: 'https://www.strategicmindsai.com', X1_SEO_APPROVED_DOMAINS: 'www.strategicmindsai.com' };

test('SEO stays noindex by default even with a canonical URL', () => {
 const policy = resolveSeoPolicy({ VITE_CANONICAL_SITE_URL: 'https://www.strategicmindsai.com', X1_SEO_APPROVED_DOMAINS: 'www.strategicmindsai.com' });
 assert.equal(policy.indexable, false);
 assert.match(renderRobots(policy), /Disallow: \//);
 assert.equal(renderSitemap(policy), null);
});

test('indexing requires both an explicit flag and exact approved HTTPS hostname', () => {
 assert.equal(resolveSeoPolicy(approvedEnv).indexable, true);
 assert.equal(resolveSeoPolicy({ ...approvedEnv, VITE_CANONICAL_SITE_URL: 'https://preview.vercel.app' }).indexable, false);
 assert.equal(resolveSeoPolicy({ ...approvedEnv, X1_SEO_INDEXING_ENABLED: 'false' }).indexable, false);
 assert.equal(resolveSeoPolicy({ ...approvedEnv, VITE_CANONICAL_SITE_URL: 'http://www.strategicmindsai.com' }).indexable, false);
});

test('approved sitemap contains only public canonical routes', () => {
 const xml = renderSitemap(resolveSeoPolicy(approvedEnv));
 assert.match(xml, /https:\/\/www\.strategicmindsai\.com\/v2\/b/);
 assert.match(xml, /https:\/\/www\.strategicmindsai\.com\/pricing/);
 assert.doesNotMatch(xml, /\/admin|\/portal/);
});

test('build output defaults to noindex and deletes stale sitemap', async () => {
 const outDir = await mkdtemp(join(tmpdir(), 'x1-seo-'));
 try {
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), '<html><head><meta name="robots" content="noindex,nofollow,noarchive"/></head><body></body></html>');
  await writeFile(join(outDir, 'sitemap.xml'), '<stale/>');
  const result = await prepareSeoBuild({ outDir, env: {} });
  assert.equal(result.indexable, false);
  assert.match(await readFile(join(outDir, 'robots.txt'), 'utf8'), /Disallow: \//);
  await assert.rejects(readFile(join(outDir, 'sitemap.xml'), 'utf8'), { code: 'ENOENT' });
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /noindex,nofollow,noarchive/);
 } finally { await rm(outDir, { recursive: true, force: true }); }
});

test('approved build writes sitemap and canonical tag', async () => {
 const outDir = await mkdtemp(join(tmpdir(), 'x1-seo-approved-'));
 try {
  await writeFile(join(outDir, 'index.html'), '<html><head><meta name="robots" content="noindex,nofollow,noarchive"/></head><body></body></html>');
  const result = await prepareSeoBuild({ outDir, env: approvedEnv });
  assert.equal(result.indexable, true);
  assert.match(await readFile(join(outDir, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/www\.strategicmindsai\.com\/sitemap\.xml/);
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /name="robots" content="index,follow"/);
  assert.match(await readFile(join(outDir, 'index.html'), 'utf8'), /rel="canonical"/);
 } finally { await rm(outDir, { recursive: true, force: true }); }
});
