/*
 * X1 Fleet Bridge Worker v3
 * Run: node apps/strategic-minds-v2/bridge/worker.js
 *
 * Connects to X1 directly via the Base44 API. No custom functions needed.
 * Creates a worker record, heartbeats, polls for queued jobs, executes them,
 * and reports results back.
 */

import { exec } from 'child_process';
import os from 'os';

// The app runtime URL — override any editor URL the user may have set
let rawUrl = process.env.X1_BASE_URL || 'https://1-operating-system.base44.app';
// If they pasted the editor URL, extract the app slug and fix it
if (rawUrl.includes('app.base44.com')) {
  rawUrl = 'https://1-operating-system.base44.app';
}
const BASE_URL = rawUrl.replace(/\/+$/, '');
const WORKER_TOKEN = process.env.X1_WORKER_TOKEN || '';
const WORKER_NAME = process.env.X1_WORKER_NAME || os.hostname();
const POLL_INTERVAL = 5000;
const HEARTBEAT_INTERVAL = 30000;
const MAX_JOB_TIME = 120000;

if (!WORKER_TOKEN) {
  console.error('Missing X1_WORKER_TOKEN. Set it in your environment or .env file.');
  console.error('Get the worker token from the X1 Secrets page.');
  process.exit(1);
}

const API = `${BASE_URL}/api/v1/entities`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${WORKER_TOKEN}`,
};

async function apiCall(path, opts = {}) {
  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { ...HEADERS, ...(opts.headers || {}) },
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
    if (!res.ok) {
      return { error: `API ${res.status}: ${text.slice(0, 300)}` };
    }
    return data;
  } catch (e) {
    return { error: e.message };
  }
}

let workerId = null;

async function registerWorker() {
  const dockerVer = await run('docker --version 2>&1 || echo "not available"');
  const ollamaVer = await run('ollama --version 2>&1 || echo "not available"');
  let modelList = [];
  try {
    const models = await run('ollama list --format json 2>/dev/null || echo "[]"');
    modelList = JSON.parse(models).map(m => m.name).filter(Boolean);
  } catch {}

  const body = {
    name: WORKER_NAME,
    host: os.hostname(),
    platform: os.platform(),
    status: 'online',
    kind: 'mixed',
    docker_available: !dockerVer.includes('not available'),
    docker_version: dockerVer.trim(),
    ollama_version: ollamaVer.trim(),
    models: modelList,
    shell_enabled: true,
    capabilities: ['ollama_chat', 'docker_ps', 'docker_images', 'docker_logs', 'docker_run', 'host_shell', 'sandbox_run'],
    last_seen_at: new Date().toISOString(),
    jobs_completed: 0,
    jobs_failed: 0,
    image_count: 0,
  };

  // Try to find existing worker by name
  const filterParam = encodeURIComponent(JSON.stringify({ name: WORKER_NAME }));
  const existing = await apiCall(`/X1Worker?filter=${filterParam}&limit=1`);
  const items = existing && existing.items ? existing.items : (Array.isArray(existing) ? existing : []);

  if (items.length > 0 && items[0].id) {
    workerId = items[0].id;
    await apiCall(`/X1Worker/${workerId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  } else {
    const created = await apiCall('/X1Worker', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (created && created.id) {
      workerId = created.id;
    } else if (created && created.error) {
      console.error('Failed to register worker:', created.error);
      // Try with PUT as fallback
      const putRes = await apiCall('/X1Worker', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (putRes && putRes.id) {
        workerId = putRes.id;
      } else {
        console.error('PUT also failed:', putRes && putRes.error ? putRes.error : 'unknown');
        return false;
      }
    }
  }

  console.log(`[${new Date().toISOString()}] Worker registered: ${WORKER_NAME} (id: ${workerId || 'unknown'})`);
  console.log(`  Docker: ${!dockerVer.includes('not available') ? dockerVer.trim() : 'not available'}`);
  console.log(`  Ollama: ${!ollamaVer.includes('not available') ? ollamaVer.trim() : 'not available'}`);
  console.log(`  Models: ${modelList.length > 0 ? modelList.join(', ') : 'none installed'}`);
  return true;
}

async function heartbeat() {
  if (!workerId) return;
  try {
    await apiCall(`/X1Worker/${workerId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'online',
        last_seen_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error('Heartbeat failed:', e.message);
  }
}

async function claimAndRunJob() {
  const filterParam = encodeURIComponent(JSON.stringify({ status: 'queued' }));
  const queued = await apiCall(`/X1BridgeJob?filter=${filterParam}&limit=1&sort=created_date`);
  const items = queued && queued.items ? queued.items : (Array.isArray(queued) ? queued : []);
  if (!items.length) return;

  const job = items[0];
  console.log(`[${new Date().toISOString()}] Claiming job ${job.id}: ${job.title || 'untitled'} (${job.kind})`);

  // Claim it
  await apiCall(`/X1BridgeJob/${job.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'claimed',
      claimed_at: new Date().toISOString(),
      worker_name: WORKER_NAME,
      lease_expires_at: new Date(Date.now() + MAX_JOB_TIME).toISOString(),
    }),
  });

  // Execute
  const start = Date.now();
  let result = '';
  let error = '';

  try {
    switch (job.kind) {
      case 'ollama_chat': {
        const model = job.model || 'llama3.2';
        const prompt = (job.system_prompt ? `SYSTEM: ${job.system_prompt}\n\n` : '') + (job.prompt || '');
        result = await run(`ollama run ${model} --nowordwrap 2>&1`, undefined, prompt);
        break;
      }
      case 'ollama_models':
        result = await run('ollama list 2>&1');
        break;
      case 'docker_ps':
        result = await run('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" 2>&1');
        break;
      case 'docker_images':
        result = await run('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>&1');
        break;
      case 'docker_logs':
        result = await run(`docker logs --tail ${job.tail || 200} ${job.container || ''} 2>&1`);
        break;
      case 'docker_run':
        result = await run(job.command || 'echo "No command provided"', MAX_JOB_TIME);
        break;
      case 'host_shell':
        result = await run(job.command || job.prompt || 'echo "No command provided"', MAX_JOB_TIME);
        break;
      default:
        result = `Unknown job kind: ${job.kind}`;
    }
  } catch (e) {
    error = e.message;
    result = '';
  }

  const duration = Date.now() - start;

  // Complete the job
  await apiCall(`/X1BridgeJob/${job.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: error ? 'failed' : 'done',
      result: (result || '').slice(0, 8000),
      error: error || '',
      worker_name: WORKER_NAME,
      duration_ms: duration,
      finished_at: new Date().toISOString(),
    }),
  });

  console.log(`[${new Date().toISOString()}] Job ${job.id} ${error ? 'failed' : 'done'} in ${duration}ms`);
}

function run(cmd, timeout = MAX_JOB_TIME, stdin = null) {
  return new Promise((resolve) => {
    const child = exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 5, shell: 'powershell.exe' }, (err, stdout, stderr) => {
      if (err) resolve(stderr || err.message);
      resolve(stdout || '');
    });
    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
}

async function loop() {
  console.log(`[${new Date().toISOString()}] X1 Fleet Bridge Worker v3 starting: ${WORKER_NAME}`);
  console.log(`API: ${API}`);
  console.log('Press Ctrl+C to stop.\n');

  const ok = await registerWorker();
  if (!ok) {
    console.error('Could not register worker. Check X1_WORKER_TOKEN.');
    process.exit(1);
  }

  setInterval(heartbeat, HEARTBEAT_INTERVAL);
  setInterval(async () => {
    try { await claimAndRunJob(); } catch (e) { console.error('Job poll error:', e.message); }
  }, POLL_INTERVAL);

  console.log('Worker is live. Waiting for jobs...\n');
}

loop();
