import { runWorkItems } from "../../server/x1-work-items.mjs";
export default async function handler(req, res) {
  return runWorkItems(req, res);
}
