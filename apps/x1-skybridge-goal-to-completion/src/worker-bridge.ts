import { createHash } from "node:crypto";
import { open, readFile, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";

const root = process.env.X1_LOCAL_ROOT || "/mnt/c/_Strategic_Minds_AI_OS";
const fabric = path.resolve(root, "07_Infrastructure", "backend-fabric");
const jobScript = path.join(fabric, "jobs", "smoke-standard.py");
const inbox = path.join(fabric, "inbox", "standard");
const mirror = path.join(fabric, "mirror");
const idFormat = /^[A-Za-z0-9._-]{6,64}$/;
const sha = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const receiptPath = (id: string) => path.join(mirror, "receipts", id + ".receipt.json");
const statePath = (id: string) => path.join(mirror, "state", id + ".json");

export function deriveProbeJobId(requestId: string) {
  if (!idFormat.test(requestId)) throw new Error("Invalid request identifier");
  return "X1MCP-READ-" + sha("x1-mcp-probe-v1:" + requestId).slice(0, 20);
}
async function jsonIfExists(file: string): Promise<any | null> {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (e: any) { if (e?.code === "ENOENT") return null; throw e; }
}
export async function inspectProbeJob(requestId: string) {
  const jobId = deriveProbeJobId(requestId);
  const [receipt, state, queued] = await Promise.all([
    jsonIfExists(receiptPath(jobId)), jsonIfExists(statePath(jobId)),
    stat(path.join(inbox, jobId + ".json")).then(() => true).catch(e => e?.code === "ENOENT" ? false : Promise.reject(e))
  ]);
  return {
    jobId,
    exists: !!receipt || !!state || queued,
    status: receipt?.result === "PASS" ? "COMPLETED" :
      receipt?.result === "FAIL" ? "FAILED" : state?.status || (queued ? "QUEUED" : "NOT_FOUND"),
    receiptVerified: receipt?.result === "PASS" && receipt?.exit_code === 0,
    workerId: typeof receipt?.worker_id === "string" ? receipt.worker_id.slice(0, 50) : null,
    completedAt: typeof receipt?.finished_at === "string" ? receipt.finished_at : null,
    note: "Receipt proves only the named read-only local worker probe, not app deployment."
  };
}

/** Backend adapter only. Not exported as a remotely callable MCP tool until OAuth is enforced. */
export async function dispatchReadOnlyProbe(requestId: string) {
  if (process.env.X1_LOCAL_PROBE_BACKEND !== "enabled-local-only") {
    throw new Error("LOCAL_DISPATCH_DISABLED: requires trusted local backend authorization");
  }
  const jobId = deriveProbeJobId(requestId);
  const marker = path.join(inbox, "." + jobId + ".submitted");
  const current = await inspectProbeJob(requestId);
  if (current.exists) return { ...current, idempotent: true };
  let reservation;
  try { reservation = await open(marker, "wx", 0o600); }
  catch (error: any) {
    if (error?.code === "EEXIST") return { ...(await inspectProbeJob(requestId)), status: "ALREADY_RESERVED", idempotent: true };
    throw error;
  }
  try {
    const scriptBytes = await readFile(jobScript);
    const scriptSHA = sha(scriptBytes);
    const scriptWslPath = path.resolve(jobScript);
    if (scriptWslPath !== "/mnt/c/_Strategic_Minds_AI_OS/07_Infrastructure/backend-fabric/jobs/smoke-standard.py") {
      throw new Error("LOCAL_WORKER_PATH_MISMATCH: canonical WSL2 backend path required");
    }
    const packet = {
      schema_version: "1.0", job_id: jobId, queue: "standard",
      action_class: "READ", script_path: scriptWslPath,
      script_sha256: scriptSHA, args: [], timeout_sec: 30,
      retry_budget: 0, submitted_at: new Date().toISOString(),
      submitted_by: "x1-skybridge-local-backend", interactive_ui: false,
      polling_required: false, completion_read_method: "DIRECT_JSON_FILE_READ"
    };
    // The existing worker only consumes *.json. A unique temp name avoids partial consumption.
    const tmp = path.join(inbox, "." + jobId + ".tmp");
    const dest = path.join(inbox, jobId + ".json");
    const h = await open(tmp, "wx", 0o600);
    try { await h.writeFile(JSON.stringify(packet) + "\n", "utf8"); }
    finally { await h.close(); }
    await rename(tmp, dest);
    return { jobId, status: "QUEUED", scriptSHA, actionClass: "READ", idempotent: false };
  } catch (error) {
    await unlink(marker).catch(() => undefined);
    throw error;
  } finally { await reservation.close(); }
}
