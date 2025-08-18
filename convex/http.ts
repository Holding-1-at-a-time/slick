import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { corsRouter } from "convex-helpers/server/cors";
import { rag } from "./rag";

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateRequest(request);
  if (!event) {
    return new Response("Error occurred", { status: 400 });
  }
  switch (event.type) {
    case "user.created":
    case "user.updated":
      await ctx.runMutation(internal.users.createOrUpdate, {
        clerkUser: event.data,
      });
      break;
    case "user.deleted":
        if (event.data.id) {
            await ctx.runMutation(internal.users.deleteClerkUser, {
                clerkId: event.data.id,
            });
        }
      break;
  }
  return new Response(null, { status: 200 });
});

const handleUploadKnowledgeFile = httpAction(async (ctx, request) => {
    // Check if the user is an admin.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return new Response("Unauthorized", { status: 401 });
    }
    const user = await ctx.runQuery(internal.users.getByIdentity);
    if (!user || user.role !== 'admin') {
        return new Response("Forbidden", { status: 403 });
    }
    
    // Store the file
    const blob = await request.blob();
    const storageId = await ctx.storage.store(blob);
    const originalFilename = request.headers.get("X-Filename") ?? 'document.txt';

    // Start the RAG processing
    await rag.addAsync(ctx, {
        namespace: "globalKnowledgeBase",
        key: `file-${storageId}`, // Use storageId as part of the key for uniqueness
        chunkerAction: internal.rag.chunkerAction,
        metadata: { storageId },
        title: originalFilename,
    });

    return new Response(JSON.stringify({ success: true, storageId }), {
        headers: { 'Content-Type': 'application/json' },
    });
});


const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

// Using CORS router wrapper for the new endpoint
const cors = corsRouter(http);
cors.route({
  path: "/uploadKnowledgeFile",
  method: "POST",
  handler: handleUploadKnowledgeFile,
});


async function validateRequest(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(payloadString, svixHeaders) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return null;
  }
  return evt;
}

export default cors.http;