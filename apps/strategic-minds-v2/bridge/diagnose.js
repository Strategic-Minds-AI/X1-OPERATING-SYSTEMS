/* X1 API Diagnostic — finds the correct endpoint format */
import os from 'os';

const BASE_URL = 'https://1-operating-system.base44.app';
const TOKEN = process.env.X1_WORKER_TOKEN || '';
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

async function tryFetch(label, url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: HEADERS };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(`${label}: ${res.status} ${method} ${url.replace(BASE_URL, '')}`);
    console.log(`  ${text.slice(0, 200)}`);
    return res.ok;
  } catch (e) {
    console.log(`${label}: ERROR ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`Testing API endpoints on ${BASE_URL}`);
  console.log(`Token: ${TOKEN.slice(0, 4)}...${TOKEN.slice(-4)}`);
  console.log('---\n');

  // Try various entity API paths
  await tryFetch('GET v1/entities/X1Worker', `${BASE_URL}/api/v1/entities/X1Worker?limit=1`);
  await tryFetch('GET api/entities/X1Worker', `${BASE_URL}/api/entities/X1Worker?limit=1`);
  await tryFetch('GET v1/X1Worker', `${BASE_URL}/v1/X1Worker?limit=1`);
  await tryFetch('GET entities/X1Worker', `${BASE_URL}/entities/X1Worker?limit=1`);
  await tryFetch('GET api/v1/X1Worker', `${BASE_URL}/api/v1/X1Worker?limit=1`);
  
  // Try POST on each
  const testBody = { name: 'JARVIS-COMMAND', status: 'online', host: os.hostname(), platform: os.platform(), kind: 'mixed' };
  await tryFetch('POST v1/entities/X1Worker', `${BASE_URL}/api/v1/entities/X1Worker`, 'POST', testBody);
  await tryFetch('POST api/entities/X1Worker', `${BASE_URL}/api/entities/X1Worker`, 'POST', testBody);
  await tryFetch('POST v1/X1Worker', `${BASE_URL}/v1/X1Worker`, 'POST', testBody);
  await tryFetch('POST entities/X1Worker', `${BASE_URL}/entities/X1Worker`, 'POST', testBody);
  await tryFetch('POST api/v1/X1Worker', `${BASE_URL}/api/v1/X1Worker`, 'POST', testBody);

  // Try without auth
  console.log('\n--- Without auth ---');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/entities/X1Worker?limit=1`);
    console.log(`No-auth GET: ${res.status}`);
    console.log(`  ${(await res.text()).slice(0, 200)}`);
  } catch (e) {
    console.log(`No-auth: ${e.message}`);
  }

  // Try the functions endpoint
  console.log('\n--- Functions ---');
  await tryFetch('GET functions/x1Status', `${BASE_URL}/functions/x1Status`);
}

main();
