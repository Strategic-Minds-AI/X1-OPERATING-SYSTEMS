// Dynamic server-only MCP adapter route; no direct browser or public mutations.
import {runX1McpAdapter} from "../../../../server/x1-mcp-adapter.mjs";
export default async function handler(req,res){return runX1McpAdapter(req,res);}
