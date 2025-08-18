// convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config";
import actionRetrier from "@convex-dev/action-retrier/convex.config";
import actionCache from "@convex-dev/action-cache/convex.config";

const app = defineApp();
app.use(rag);
app.use(actionRetrier);
app.use(actionCache);

export default app;