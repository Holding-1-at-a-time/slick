// convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config";
import actionRetrier from "@convex-dev/action-retrier/convex.config";
import actionCache from "@convex-dev/action-cache/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";
import agent from "@convex-dev/agent/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(rag);
app.use(actionRetrier);
app.use(actionCache);
app.use(aggregate, { name: "customerCount" });
app.use(aggregate, { name: "jobStats" });
app.use(aggregate, { name: "productStockStatus" });
app.use(aggregate, { name: "servicePerformance" });
app.use(aggregate, { name: "technicianPerformance" });
app.use(agent);
app.use(rateLimiter);

export default app;