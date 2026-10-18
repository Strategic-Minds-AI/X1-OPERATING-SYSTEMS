import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PUBLIC_PATHS = ['/v2/b', '/pricing'];

export function resolveSeoPolicy(env = process.env) {
  let canonical;
  try { canonical = new URL(env.VITE_CANONICAL_SITE_URL || ''); }
  catch { return { indexable: false, reason: 'CANONICAL_URL_MISSING_OR_INVALID', canonicalUrl: null, hostname: null }; }
  const host = canonical.hostname.toLowerCase();
  const approved = new Set(String(env.X1_SEO_APPROVED_DOMAINS || '')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const secureOrigin = canonical.protocol === 'https:' && !canonical.username && !canonical.password &&
    !canonical.search && !canonical.hash && !canonical.port && (canonical.pathname === '/' || canonical.pathname === '');
  if (env.VERCEL_ENV !== 'production') return { indexable: false, reason: 'NON_PRODUCTION_DEPLOYMENT', canonicalUrl: canonical.origin, hostname: host };
  if (env.X1_SEO_INDEXING_ENABLED !== 'true') return { indexable: false, reason: 'INDEXING_FLAG_NOT_ENABLED', canonicalUrl: canonical.origin, hostname: host };
  if (!secureOrigin) return { indexable: false, reason: 'CANONICAL_ORIGIN_NOT_SECURE_OR_NOT_ROOT', canonicalUrl: canonical.origin, hostname: host };
  if (!approved.has(host)) return { indexable: false, reason: 'HOSTNAME_NOT_EXPLICITLY_APPROVED', canonicalUrl: canonical.origin, hostname: host };
  return { indexable: true, reason: 'EXPLICIT_HOST_AND_FLAG_APPROVED', canonicalUrl: canonical.origin, hostname: host };
}

export function renderRobots(policy) {
  if (!policy.indexable) return 'User-agent: *\nDisallow: /\n';
  return 'User-agent: *\nAllow: /\n\nSitemap: ' + policy.canonicalUrl + '/sitemap.xml\n';
}

export function renderSitemap(policy) {
  if (!policy.indexable) return null;
  const urls = PUBLIC_PATHS.map(path => '  <url><loc>' + policy.canonicalUrl + path + '</loc></url>').join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n';
}

export async function prepareSeoBuild({ outDir = resolve('dist'), env = process.env } = {}) {
  const policy = resolveSeoPolicy(env);
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, 'robots.txt'), renderRobots(policy), 'utf8');
  const sitemap = renderSitemap(policy);
  if (sitemap) await writeFile(resolve(outDir, 'sitemap.xml'), sitemap, 'utf8');
  else await rm(resolve(outDir, 'sitemap.xml'), { force: true });

  const htmlPath = resolve(outDir, 'index.html');
  try {
    let html = await readFile(htmlPath, 'utf8');
    const robotsTag = '<meta name="robots" content="' + (policy.indexable ? 'index,follow' : 'noindex,nofollow,noarchive') + '"/>';
    if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, robotsTag);
    else html = html.replace('</head>', '  ' + robotsTag + '\n </head>');
    html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/ig, '');
    if (policy.indexable) html = html.replace('</head>', '  <link rel="canonical" href="' + policy.canonicalUrl + '/v2/b"/>\n </head>');
    await writeFile(htmlPath, html, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return { ...policy, sitemapPublished: Boolean(sitemap), robotsMode: policy.indexable ? 'ALLOW_WITH_SITEMAP' : 'DISALLOW_ALL' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await prepareSeoBuild();
  process.stdout.write(JSON.stringify({ status: result.indexable ? 'INDEXING_APPROVED' : 'NOINDEX_SAFE_DEFAULT', ...result }) + '\n');
}
