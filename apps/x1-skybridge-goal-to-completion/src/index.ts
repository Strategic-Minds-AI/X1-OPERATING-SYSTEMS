import { app } from "./server.js";

// Fail closed: this staging MCP server has no verified OAuth/tenant isolation yet.
if (process.env.NODE_ENV === "production") {
  throw new Error("X1_RELEASE_GATE_DENIED: production requires verified OAuth, tenant isolation, and independent QA");
}

export default await app.run();
