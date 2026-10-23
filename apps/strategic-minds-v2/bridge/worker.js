/*
 * X1 Fleet Bridge Worker v4
 *
 * Reads queued jobs from X1 (GET works), executes them locally,
 * and writes results to a file that gets committed to git.
 * CLAW reads the results from GitHub and updates the job records.
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
    const res = await fetch(`${API}${path}`, { headers: HEADERS });
    const text = await res.text();
    if (!res.ok) return { error: `${res.status}: ${text.slice(0, 200)}` };
    return JSON.parse(text);
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

async function checkMachine() {
  const docker = await run('docker --version 2>&1 || echo "not available"');
  const ollama = await run('ollama --version 2>&1 || echo "not available"');
  let models = [];
  try {
    const list = await run('ollama list 2>&1 || echo ""');
    models = list.split('\n').filter(l => l.trim() && !l.includes('not available')).map(l => l.split(/\s+/)[0]).filter(Boolean);
  } catch {}
  return {
    name: WORKER_NAME,
    host: os.hostname(),
    platform: os.platform(),
    docker: !docker.includes('not available') ? docker.trim() : 'not available',
    ollama: !ollama.includes('not available') ? ollama.trim() : 'not available',
    models,
    timestamp: new Date().toISOString(),
  };
}

async function pollJobs() {
  // Read queued jobs
  const filter = encodeURIComponent(JSON.stringify({ status: 'queued' }));
  const data = await apiGet(`/X1BridgeJob?filter=${filter}&limit=3&sort=created_date`);

  if (data.error) {
    if (!data.error.includes('[]')) console.error('Poll error:', data.error);
    return;
  }

  const jobs = Array.isArray(data) ? data : (data.items || []);
  if (!jobs.length) return;

  for (const job of jobs) {
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
          result = await run(job.command || job.prompt || 'echo "No command provided"');
          break;
        default:
          result = `Unknown job kind: ${job.kind}`;
      }
    } catch (e) {
      error = e.message;
    }

    const duration = Date.now() - start;
    console.log(`  Done in ${duration}ms${error ? ' (ERROR: ' + error + ')' : ''}`);
    if (result) console.log(`  Result: ${result.slice(0, 200)}...`);

    // Write result to file for git commit
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

  // Commit and push results
  await commitResults();
}

function writeResult(jobId, result) {
  if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
  // Write individual result
  writeFileSync(join(RESULTS_DIR, `${jobId}.json`), JSON.stringify(result, null, 2));
  // Update latest
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
    await run('git add apps/strategic-minds-v2/bridge/results/ 2>&1');
    const status = await run('git diff --cached --name-only 2>&1');
    if (!status.trim()) return; // nothing to commit
    await run(`git commit -m "Bridge worker results: ${new Date().toISOString()}" 2>&1`);
    await run('git push 2>&1');
    console.log(`[${new Date().toISOString()}] Results committed and pushed`);
  } catch (e) {
    console.error('Git commit failed:', e.message);
  }
}

async function loop() {
  console.log(`[${new Date().toISOString()}] X1 Fleet Bridge Worker v4: ${WORKER_NAME}`);
  console.log(`API: ${API}`);
  console.log('Press Ctrl+C to stop.\n');

  // Report machine info
  const machine = await checkMachine();
  console.log(`Docker: ${machine.docker}`);
  console.log(`Ollama: ${machine.ollama}`);
  console.log(`Models: ${machine.models.length > 0 ? machine.models.join(', ') : 'none'}\n`);

  // Write machine info as first result
  if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, 'machine.json'), JSON.stringify(machine, null, 2));
  await commitResults();

  console.log('Worker live. Polling for jobs every 8 seconds...\n');

  setInterval(pollJobs, POLL_INTERVAL);
}

loop();
