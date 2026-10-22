/*
 * X1 Fleet Bridge Worker
 * Run: node apps/strategic-minds-v2/bridge/worker.js
 *
 * This worker connects to the X1 Operating System, claims queued jobs,
 * executes them locally (Ollama chat, Docker commands, host shell),
 * and reports results back. It is the bridge between the cloud control
 * surface and the local machine.
 */

import { exec } from 'child_process';
import os from 'os';

const BASE_URL = process.env.X1_BASE_URL || '';
const WORKER_TOKEN = process.env.X1_WORKER_TOKEN || '';
const WORKER_NAME = process.env.X1_WORKER_NAME || os.hostname();
const POLL_INTERVAL = 5000;
const MAX_JOB_TIME = 120000;

if (!BASE_URL || !WORKER_TOKEN) {
  console.error('Missing X1_BASE_URL or X1_WORKER_TOKEN. Set them in your environment or .env file.');
  console.error('Get the worker token from the X1 Secrets page.');
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WORKER_TOKEN}`,
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

async function heartbeat() {
  try {
    const dockerVer = await run('docker --version 2>&1 || echo "not available"');
    const ollamaVer = await run('ollama --version 2>&1 || echo "not available"');
    const models = await run('ollama list --format json 2>/dev/null || echo "[]"');
    let modelList = [];
    try { modelList = JSON.parse(models).map(m => m.name); } catch {}

    await api('/functions/x1FleetHeartbeat', {
      method: 'POST',
      body: JSON.stringify({
        name: WORKER_NAME,
        platform: os.platform(),
        host: os.hostname(),
        docker_available: !dockerVer.includes('not available'),
        docker_version: dockerVer.trim(),
        ollama_version: ollamaVer.trim(),
        models: modelList,
        shell_enabled: true,
        capabilities: ['ollama_chat', 'docker_ps', 'docker_images', 'docker_logs', 'docker_run', 'host_shell'],
        kind: 'mixed',
      }),
    });
    console.log(`[${new Date().toISOString()}] Heartbeat sent: ${modelList.length} models, docker=${!dockerVer.includes('not available')}`);
  } catch (e) {
    console.error('Heartbeat failed:', e.message);
  }
}

function run(cmd, timeout = MAX_JOB_TIME) {
  return new Promise((resolve) => {
    exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
      if (err) resolve(stderr || err.message);
      resolve(stdout || '');
    });
  });
}

async function claimJob() {
  try {
    const data = await api('/functions/x1FleetClaim', { method: 'POST' });
    return data && data.job ? data.job : null;
  } catch (e) {
    console.error('Claim failed:', e.message);
    return null;
  }
}

async function completeJob(jobId, result, error) {
  try {
    await api('/functions/x1FleetComplete', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        result: (result || '').slice(0, 8000),
        error: error || '',
        worker_name: WORKER_NAME,
      }),
    });
  } catch (e) {
    console.error('Complete failed:', e.message);
  }
}

async function executeJob(job) {
  console.log(`[${new Date().toISOString()}] Executing job ${job.id}: ${job.title} (${job.kind})`);
  const start = Date.now();

  try {
    let result = '';
    switch (job.kind) {
      case 'ollama_chat': {
        const model = job.model || 'llama3.2';
        const prompt = (job.system_prompt ? `SYSTEM: ${job.system_prompt}\n\n` : '') + (job.prompt || '');
        result = await run(`ollama run ${model} --nowordwrap 2>&1 <<'PROMPT_EOF'\n${prompt}\nPROMPT_EOF`);
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
        result = await run(job.command || 'echo "No command provided"', MAX_JOB_TIME);
        break;
      default:
        result = `Unknown job kind: ${job.kind}`;
    }
    await completeJob(job.id, result, null);
    console.log(`[${new Date().toISOString()}] Job ${job.id} done in ${Date.now() - start}ms`);
  } catch (e) {
    await completeJob(job.id, '', e.message);
    console.error(`Job ${job.id} failed:`, e.message);
  }
}

async function loop() {
  console.log(`[${new Date().toISOString()}] X1 Fleet Bridge Worker starting: ${WORKER_NAME}`);
  console.log(`Connecting to ${BASE_URL}`);
  console.log('Press Ctrl+C to stop.\n');

  // Initial heartbeat
  await heartbeat();

  // Heartbeat every 60 seconds
  setInterval(heartbeat, 60000);

  // Poll for jobs every 5 seconds
  setInterval(async () => {
    const job = await claimJob();
    if (job) await executeJob(job);
  }, POLL_INTERVAL);
}

loop();
