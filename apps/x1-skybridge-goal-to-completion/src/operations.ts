import { readFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";

const exec = promisify(execFile);
const ROOT = process.env.X1_LOCAL_ROOT || "/mnt/c/_Strategic_Minds_AI_OS";
const FABRIC = path.join(ROOT, "07_Infrastructure/backend-fabric/mirror");
const CONTROL_URL = "http://127.0.0.1:4311/health";
const OLLAMA_URL = "http://127.0.0.1:11434/api/tags";

async function fetchLocal(url: string, ms = 1800): Promise<{reachable: boolean; status: number; data?: any}> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(ms) });
    if (!resp.ok) return { reachable: false, status: resp.status };
    const data = await resp.json();
    return { reachable: true, status: resp.status, data };
  } catch { return { reachable: false, status: 0 }; }
}
async function safeJSON(file: string) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; }
}
function redactWorker(input: any) {
  return {
    id: String(input.worker_id || "").slice(0, 60),
    class: String(input.worker_class || "").slice(0, 20),
    status: String(input.status || "UNKNOWN").slice(0, 30),
    updatedAt: String(input.updated_at || ""),
    jobId: input.job_id ? String(input.job_id).slice(0,120) : null
  };
}
export async function getSystemSnapshot() {
  const [control, ollama, docker] = await Promise.all([
    fetchLocal(CONTROL_URL),
    fetchLocal(OLLAMA_URL),
    exec("docker", ["info", "--format", "{{.ServerVersion}}"], { timeout: 2300 })
      .then(x => ({ reachable: true, version: x.stdout.trim().slice(0, 50) }))
      .catch(() => ({ reachable: false, version: null }))
  ]);
  const workers = await Promise.all(["build-1", "standard-1", "standard-2"]
    .map(async name => safeJSON(path.join(FABRIC, "workers", name + ".json"))));
  const now = Date.now();
  const cleanWorkers = workers.filter(Boolean).map(w => ({
    ...redactWorker(w),
    fresh: !!w.updated_at && Number.isFinite(Date.parse(w.updated_at)) && now - Date.parse(w.updated_at) < 120000
  }));
  const services = [
    { name: "X1 Local Control Plane", scope: "local", status: control.reachable && control.data?.ok === true ? "ONLINE" : "UNAVAILABLE", proof: `HTTP ${control.status}` },
    { name: "Ollama", scope: "local", status: ollama.reachable && Array.isArray(ollama.data?.models) ? "ONLINE" : "UNAVAILABLE", proof: ollama.reachable ? `${ollama.data.models.length} installed models` : `HTTP ${ollama.status}` },
    { name: "Docker", scope: "local", status: docker.reachable ? "ONLINE" : "UNAVAILABLE", proof: docker.reachable ? `Engine ${docker.version}` : "Engine unavailable" },
    { name: "JARVIS backend workers", scope: "local", status: cleanWorkers.length === 3 && cleanWorkers.every(w => w.fresh) ? "ONLINE" : "STALE_OR_UNKNOWN", proof: `${cleanWorkers.filter(w => w.fresh).length}/3 fresh heartbeats` },
  ];
  // Connector grants in ChatGPT do not become permissions of this process.
  for (const name of ["GitHub", "Vercel", "Supabase", "Railway"]) {
    services.push({
      name, scope: "cloud", status: "REQUIRES_SERVER_AUTH",
      proof: "Authenticated in ChatGPT is not authenticated in this app"
    });
  }
  const connectorSnapshot = await safeJSON(path.resolve(process.cwd(), "cloud-capability-snapshot.json"));
  return {
    observedAt: new Date().toISOString(), host: os.hostname(),
    services, workers: cleanWorkers, connectorSnapshot,
    localModelNames: ollama.reachable ? (ollama.data.models || []).map((m:any) => String(m.name || "").slice(0,80)).slice(0,12) : [],
    policy: {
      build: "local candidate only",
      localInference: "DISABLED_UNTIL_HARDWARE_CLEARANCE",
      cloudWrites: "DISABLED_UNTIL_SCOPED_AUTH_AND_APPROVAL",
      productionRelease: "DENIED",
      existingScheduler: "REUSE_ONLY"
    }
  };
}
export async function getLocalJobs() {
  const folder = path.join(FABRIC, "state");
  let files: string[] = [];
  try { files = (await readdir(folder)).filter(n => /^[a-zA-Z0-9._-]+\.json$/.test(n)).slice(-60); } catch {}
  const jobs = await Promise.all(files.map(async filename => {
    const x=await safeJSON(path.join(folder,filename));
    const id=filename.replace(/\.json$/,"");
    const receipt=await safeJSON(path.join(FABRIC,"receipts",id+".receipt.json"));
    if (!x && !receipt) return null;
    const finished=receipt?.result==="PASS"?"COMPLETED":receipt?.result==="FAIL"?"FAILED":null;
    return {
      id,
      status:String(finished||x?.status||x?.state||"UNKNOWN").slice(0,40),
      updatedAt:String(receipt?.finished_at||x?.updated_at||x?.created_at||""),
      receiptPresent:!!receipt,
      receiptResult:receipt?.result ? String(receipt.result).slice(0,20) : null
    };
  }));
  return { observedAt:new Date().toISOString(), source:"existing JARVIS worker mirror", count:jobs.filter(Boolean).length, jobs:jobs.filter(Boolean).slice(-20), readOnly:true };
}