/*
 * X1 Fleet Bridge Worker v5
 *
 * Reads queued jobs from X1, executes them locally,
 * writes results to a file committed to git.
 *
 * Run: node apps/strategic-minds-v2/bridge/worker.js
 */

import { exec } from 'child_process';
import os from 'os';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://1-operating-system.base44.app';
const TOKEN = process.env.X1_WORKER_TOKEN || '';
const WORKER_NAME = process.env.X1_WORKER_NAME || os.hostname();
const POLL_INTERVAL = 8000;
const RESULTS_DIR = join(__dirname, 'results');
const RESULTS_FILE = join(RESULTS_DIR, 'latest.json');

if (!TOKEN) {
  console.error('Missing X1_WORKER_TOKEN.');
  process.exit(1);
}

const API = `${BASE_URL}/api/entities`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

const processedJobs = new Set();

async function apiGet(path) {
  try {
    const url = `${API}${path}`;
    const res = await fetch(url, { headers: HEADERS });
    const text = await res.text();
    if (!res.ok) return { error: `${res.status}: ${text.slice(0, 300)}` };
    try {
      return JSON.parse(text);
    } catch {
      return { error: `Non-JSON response: ${text.slice(0, 200)}` };
    }
  } catch (e) {
    return { error: e.message };
  }
}

function run(cmd, timeout = 120000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 5, shell: 'powershell.exe' }, (err, stdout, stderr) => {
      if (err && !stdout) resolve(stderr || err.message);
      resolve(stdout || stderr || '');
    });
  });
}

async function pollJobs() {
  // Try reading all X1BridgeJob records (no filter first, to see what we get)
  let data = await apiGet('/X1BridgeJob?limit=5&sort=-created_date');

  if (data.error) {
    console.error(`[${new Date().toISOString()}] Poll error: ${data.error}`);
    return;
  }

  // Handle different response formats
  let jobs = [];
  if (Array.isArray(data)) {
    jobs = data;
  } else if (data.items) {
    jobs = data.items;
  } else if (data.data) {
    jobs = Array.isArray(data.data) ? data.data : (data.data.items || []);
  }

  // Log what we got on first poll
  if (processedJobs.size === 0) {
    console.log(`[${new Date().toISOString()}] API returned ${jobs.length} job(s)`);
    if (jobs.length > 0) {
      console.log(`  First job: ${JSON.stringify(jobs[0]).slice(0, 200)}`);
    }
  }

  // Filter for queued jobs client-side
  const queued = jobs.filter(j => j.status === 'queued');
  if (!queued.length) return;

  for (const job of queued) {
    if (processedJobs.has(job.id)) continue;
    processedJobs.add(job.id);

    console.log(`\n[${new Date().toISOString()}] Job ${job.id}: ${job.title || 'untitled'} (${job.kind})`);
    const start = Date.now();
    let result = '';
    let error = '';

    try {
      switch (job.kind) {
        case 'ollama_chat': {
          const model = job.model || 'llama3.2';
          const prompt = (job.system_prompt ? `SYSTEM: ${job.system_prompt}\n\n` : '') + (job.prompt || '');
          result = await run(`echo '${prompt.replace(/'/g, "''")}' | ollama run ${model} 2>&1`);
          break;
        }
        case 'ollama_models':
          result = await run('ollama list 2>&1');
          break;
        case 'docker_ps':
          result = await run('docker ps -a 2>&1');
          break;
        case 'docker_images':
          result = await run('docker images 2>&1');
          break;
        case 'docker_logs':
          result = await run(`docker logs --tail ${job.tail || 200} ${job.container || ''} 2>&1`);
          break;
        case 'docker_run':
        case 'host_shell':
        case 'sandbox_run':
          result = await run(job.command || job.prompt || job.prompt_text || 'echo "No command provided"');
          break;
        default:
          result = `Unknown job kind: ${job.kind}`;
      }
    } catch (e) {
      error = e.message;
    }

    const duration = Date.now() - start;
    console.log(`  Done in ${duration}ms${error ? ' (ERROR: ' + error + ')' : ''}`);
    if (result) console.log(`  Result: ${result.slice(0, 300)}`);

    writeResult(job.id, {
      job_id: job.id,
      title: job.title,
      kind: job.kind,
      status: error ? 'failed' : 'done',
      result: (result || '').slice(0, 8000),
      error: error || '',
      worker: WORKER_NAME,
      duration_ms: duration,
      finished_at: new Date().toISOString(),
    });
  }

  await commitResults();
}

function writeResult(jobId, result) {
  if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, `${jobId}.json`), JSON.stringify(result, null, 2));
  let latest = { worker: WORKER_NAME, timestamp: new Date().toISOString(), results: {} };
  if (existsSync(RESULTS_FILE)) {
    try { latest = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8')); } catch {}
  }
  latest.results[jobId] = result;
  latest.timestamp = new Date().toISOString();
  writeFileSync(RESULTS_FILE, JSON.stringify(latest, null, 2));
}

async function commitResults() {
  try {
    // Make sure we're in the repo root
    const repoRoot = join(__dirname, '..', '..', '..');
    await run(`cd "${repoRoot}" && git add apps/strategic-minds-v2/bridge/results/ 2>&1`);
    const status = await run(`cd "${repoRoot}" && git diff --cached --name-only 2>&1`);
    if (!status.trim()) return;
    await run(`cd "${repoRoot}" && git commit -m "Bridge results: ${new Date().toISOString()}" 2>&1`);
    await run(`cd "${repoRoot}" && git push 2>&1`);
    console.log(`[${new Date().toISOString()}] Results committed and pushed`);
  } catch (e) {
    console.error('Git commit failed:', e.message);
  }
}

async function loop() {
  console.log(`[${new Date().toISOString()}] X1 Fleet Bridge Worker v5: ${WORKER_NAME}`);
  console.log(`API: ${API}`);
  console.log('Press Ctrl+C to stop.\n');

  // Write machine info
  if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
  const machine = {
    name: WORKER_NAME,
    host: os.hostname(),
    platform: os.platform(),
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(RESULTS_DIR, 'machine.json'), JSON.stringify(machine, null, 2));

  // First poll immediately
  await pollJobs();
  await commitResults();

  console.log('\nPolling for jobs every 8 seconds...\n');
  setInterval(pollJobs, POLL_INTERVAL);
}

loop();
