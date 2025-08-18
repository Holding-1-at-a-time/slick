import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";

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

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
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

export default http;
