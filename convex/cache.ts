import { ActionCache } from "@convex-dev/action-cache";
import { components, internal } from "./_generated/api";

// Cache for AI-generated service descriptions, valid for 7 days.
export const serviceDescriptionCache = new ActionCache(components.actionCache, {
  action: internal.ai.internalGenerateServiceDescription,
  name: "service-descriptions-v1",
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

// Cache for answers from the RAG knowledge base, valid for 1 day.
export const ragQuestionCache = new ActionCache(components.actionCache, {
    action: internal.rag.internalAskQuestion,
    name: "rag-questions-v1",
    ttl: 1000 * 60 * 60 * 24, // 1 day
});