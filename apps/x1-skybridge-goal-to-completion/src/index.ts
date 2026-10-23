import { app } from "./server.js";

// Staging deploys require OAuth, user/tenant verification and explicit staging mode.
// Production releases remain protected by X1 release controls.

export default await app.run();
