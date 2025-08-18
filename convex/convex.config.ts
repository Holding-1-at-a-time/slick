// convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config";
import actionRetrier from "@convex-dev/action-retrier/convex.config";

const app = defineApp();
app.use(rag);
app.use(actionRetrier);

export default app;