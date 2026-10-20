import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const r=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('pricing and portal URLs are mounted on standalone X1 frontend',()=>{
 const main=r('../src/main.jsx');
 for(const path of ['"/pricing"','"/portal"'])assert.ok(main.includes(path),path);
});
test('marketing nav leads to pricing and portal without changing original visual hero',()=>{
 const src=r('../src/V2Experience.jsx');
 assert.ok(src.includes("['PRICING','/pricing']"));
 assert.ok(src.includes("['PORTAL','/portal']"));
 assert.ok(src.includes('v2-earth-hero'));
});
test('proposed pricing is clearly custom and never misrepresents live checkout',()=>{
 const p=r('../src/PricingExperience.jsx');
 for(const word of ['AI Launch','AI Growth','AI Enterprise','Custom quote','No approved public dollar pricing','Nothing is automatically sent','DISCOVERY-FIRST PRICING'])assert.ok(p.includes(word),word);
 assert.doesNotMatch(p,/stripe\.com|checkout\.sessions|fetch\(|PaymentIntent|base44/i);
});
test('portal authenticates existing X1 tenant members and reads actual bounded tenant data, no synthetic lead or approval records',()=>{
 const p=r('../src/ClientPortalExperience.jsx');
 for(const word of ['/api/x1/agent-config','/auth/v1/otp','/auth/v1/verify','/api/x1/operator-status','/api/x1/work-items','TENANT_SCOPE_UNVERIFIED'])assert.ok(p.includes(word),word);
 assert.doesNotMatch(p,/Sample Inquiry 001|APPROVAL_ITEMS|SYNTHETIC DATA|APPROVE IN DEMO|Demo Company/);
 assert.doesNotMatch(p,/\blocalStorage|\bsessionStorage|window\.location\.assign/);
});
test('preview stays noindex while approved production marketing routes may be indexed',()=>{
 const v=JSON.parse(r('../vercel.json'));
 const destinations=v.rewrites.map(x=>x.source);
 assert.ok(destinations.includes('/pricing')&&destinations.includes('/portal')&&destinations.includes('/portal/:path*'));
 assert.match(r('../index.html'),/noindex,nofollow,noarchive/);
 assert.ok(r('../public/robots.txt').includes('Disallow: /'));
 const adminHeaders=v.headers.find(h=>h.source==='/admin/:path*')?.headers||[];
 const portalHeaders=v.headers.find(h=>h.source==='/portal/:path*')?.headers||[];
 assert.ok(adminHeaders.some(h=>h.key==='X-Robots-Tag'&&h.value.includes('noindex')));
 assert.ok(portalHeaders.some(h=>h.key==='X-Robots-Tag'&&h.value.includes('noindex')));
 assert.match(r('../scripts/prepare-seo.mjs'),/VERCEL_ENV !== 'production'/);
 assert.match(r('../scripts/prepare-seo.mjs'),/X1_SEO_APPROVED_DOMAINS/);
});
test('commerce pages retain reduced-motion rules and source assets',()=>{
 const css=r('../src/CommercePortal.css');
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.ok(r('../src/ClientPortalExperience.jsx').includes('/v2-assets/silver-emblem.png'));
});
