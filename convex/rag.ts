import { components, internal } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536, // Needs to match your embedding model
});

export const chunkerAction = rag.defineChunkerAction(async (ctx, args) => {
  const storageId = args.entry.metadata!.storageId;
  const file = await ctx.storage.get(storageId);
  if (!file) {
    throw new Error(`File not found for storageId: ${storageId}`);
  }
  const text = await file.text();
  return { chunks: text.split("\n\n") }; // Simple chunking by paragraph
});

export const askQuestion = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // We'll use a single global namespace for simplicity in this app.
    const namespace = "globalKnowledgeBase";
    const { text, context } = await rag.generateText(ctx, {
      search: { namespace, limit: 5 },
      prompt: args.prompt,
      model: openai.chat("gpt-4o-mini"),
    });
    return { answer: text, context };
  },
});
