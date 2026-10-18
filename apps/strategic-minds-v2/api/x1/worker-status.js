import { runWorkerStatus } from "../../server/x1-worker-status.mjs";
export default async function handler(req,res){ return runWorkerStatus(req,res); }
