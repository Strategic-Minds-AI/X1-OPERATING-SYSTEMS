import { runIntelligenceScan } from "../../server/x1-intelligence-scan.mjs";
export default async function handler(req, res) { return runIntelligenceScan(req, res); }
