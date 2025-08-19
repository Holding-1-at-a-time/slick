import { GoogleGenAI, Type } from "@google/genai";
import { v } from "convex/values";
import { action, internalAction, internalQuery, ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { productAttributeCache, productSuggestionCache, serviceDescriptionCache } from "./cache";
import { rateLimiter } from "./rateLimiter";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getUserId = async (ctx: ActionCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
};

// --- Service Description Generation ---
export const generateServiceDescription = action({
  args: { serviceName: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getUserId(ctx);
    await rateLimiter.limit(ctx, "generalAI", { key: userId, throws: true });
    return await serviceDescriptionCache.fetch(ctx, args);
  },
});

export const internalGenerateServiceDescription = internalAction({
  args: { serviceName: v.string() },
  handler: async (ctx, { serviceName }): Promise<string> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a compelling, customer-facing description for an auto detailing service named "${serviceName}". Keep it concise (2-3 sentences) and highlight the key benefits.`,
    });
    return response.text;
  },
});

// --- Visual Quote Generation ---
export const suggestQuoteFromPhotos = internalAction({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    try {
      const job = await ctx.runQuery(api.jobs.get, { id: jobId });
      if (!job || !job.visualQuoteStorageIds) {
        throw new Error("Job or photo storage IDs not found.");
      }
      
      const services = await ctx.runQuery(api.services.getAll);
      const upcharges = await ctx.runQuery(api.pricing.getAllUpcharges);
      if (!services || !upcharges) throw new Error("Could not fetch services or upcharges.");
      
      const imageUrls = await Promise.all(
          job.visualQuoteStorageIds.map((id) => ctx.runQuery(api.files.getUrl, { storageId: id }))
      );

      const imageParts = await Promise.all(
          imageUrls.map(async (url) => {
              if (!url) throw new Error("Image URL not found");
              const response = await fetch(url);
              const blob = await response.blob();
              const buffer = await blob.arrayBuffer();
              
              const bytes = new Uint8Array(buffer);
              let binary = "";
              for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);

              return {
                  inlineData: {
                      mimeType: blob.type,
                      data: base64Data,
                  },
              };
          })
      );

      const prompt = `Analyze these photos of a vehicle that needs detailing. Based on the visible condition (dirt, swirls, stains, etc.), suggest a quote.

      Respond in JSON format. The JSON object should have two keys: "suggestedServiceIds" and "suggestedUpchargeIds".

      - "suggestedServiceIds": An array of service IDs that are most appropriate.
      - "suggestedUpchargeIds": An array of upcharge IDs for things like "Excessive Pet Hair" or "Heavy Stains".

      Available Services:
      ${JSON.stringify(services.map(s => ({ id: s._id, name: s.name, description: s.description })))}

      Available Upcharges:
      ${JSON.stringify(upcharges.map(u => ({ id: u._id, name: u.name, description: u.description })))}

      Analyze the images carefully and select the most relevant services and upcharges. For example, if you see a lot of dog hair on the seats, include the "Excessive Pet Hair" upcharge. If the paint looks dull and scratched, suggest a paint correction service.
      `;
      
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [...imageParts, { text: prompt }] },
          config: { responseMimeType: "application/json" }
      });

      const suggestions = JSON.parse(response.text);
      
      await ctx.runMutation(internal.jobs.updateVisualQuoteSuccess, {
          jobId,
          suggestedServiceIds: suggestions.suggestedServiceIds || [],
          suggestedUpchargeIds: suggestions.suggestedUpchargeIds || [],
      });

    } catch (error) {
        console.error(`Visual quote generation failed for jobId ${jobId}:`, error);
        await ctx.runMutation(internal.jobs.updateVisualQuoteFailure, { jobId });
    }
  },
});

// --- Appointment Scheduling ---
export const suggestAppointmentSlots = action({
    args: { jobId: v.id('jobs') },
    handler: async (ctx, { jobId }) => {
        const userId = await getUserId(ctx);
        await rateLimiter.limit(ctx, "generalAI", { key: userId, throws: true });

        const job = await ctx.runQuery(api.jobs.get, { id: jobId });
        const allAppointments = await ctx.runQuery(api.appointments.getAll);
        const allServices = await ctx.runQuery(api.services.getAll);
        if (!job || !allAppointments || !allServices) return null;

        const jobDurationHours = job.jobItems.reduce((total, item) => {
            const service = allServices.find(s => s._id === item.serviceId);
            return total + (service?.estimatedDurationHours || 2);
        }, 0);

        const prompt = `I need to schedule a new detailing job that will take approximately ${jobDurationHours} hours.
        My typical business hours are Monday-Friday 9am to 5pm.
        
        Here is a list of my currently scheduled appointments in UTC timestamps:
        ${JSON.stringify(allAppointments.map(a => ({ start: a.startTime, end: a.endTime})))}

        Based on this, suggest three optimal, non-overlapping appointment slots for the new job in the near future (within the next two weeks). Provide the start and end times for each slot.
        
        Respond ONLY with a JSON array of objects, where each object has "startTime" and "endTime" as ISO 8601 strings. Do not include any other text or explanation.
        Example: [{"startTime": "2024-08-15T13:00:00.000Z", "endTime": "2024-08-15T17:00:00.000Z"}]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        return JSON.parse(response.text);
    }
});

// --- Marketing Campaign Generation ---
export const generateCampaignContent = internalAction({
    args: { goal: v.string(), campaignId: v.id('campaigns') },
    handler: async (ctx, { goal, campaignId }) => {
        try {
            const company = await ctx.runQuery(api.company.get);
            
            const prompt = `I am the owner of an auto detailing business called "${company?.name || 'Detailing Pro'}".
            I want to create an email marketing campaign with the following goal: "${goal}".
            
            Please generate a compelling subject line and email body for this campaign. The tone should be professional but friendly.
            
            Respond ONLY with a JSON object with two keys: "subject" and "body". The body should be a single string with newline characters (\\n) for paragraphs.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            
            const content = JSON.parse(response.text);

            await ctx.runMutation(internal.marketing.updateGeneratedCampaignContent, {
                campaignId,
                subject: content.subject,
                body: content.body,
            });

        } catch (error) {
            console.error(`Campaign generation failed for campaignId ${campaignId}:`, error);
            await ctx.runMutation(internal.marketing.failCampaignGeneration, { campaignId });
        }
    }
});

// --- Smart Inventory ---
export const suggestProductAttributes = action({
  args: { productName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    await rateLimiter.limit(ctx, "generalAI", { key: userId, throws: true });
    return productAttributeCache.fetch(ctx, args);
  },
});

export const internalSuggestProductAttributes = internalAction({
  args: { productName: v.string() },
  handler: async (_, { productName }) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `For the auto detailing product "${productName}", suggest a category and a common unit of measurement.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'e.g., "Chemicals", "Pads", "Tools"' },
            unit: { type: Type.STRING, description: 'e.g., "bottle", "gallon", "unit", "pack"' },
          },
        },
      },
    });
    return JSON.parse(response.text);
  },
});

export const suggestProductsForService = action({
    args: { serviceName: v.string(), serviceDescription: v.string() },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        await rateLimiter.limit(ctx, "generalAI", { key: userId, throws: true });
        return productSuggestionCache.fetch(ctx, args);
    },
});

export const internalSuggestProductsForService = internalAction({
    args: { serviceName: v.string(), serviceDescription: v.string() },
    handler: async (ctx, { serviceName, serviceDescription }) => {
        const allProducts = await ctx.runQuery(internal.ai.getAllProducts);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Given the service "${serviceName}" (Description: "${serviceDescription}"), which of the following products are likely to be used?
          
          Available Products:
          ${JSON.stringify(allProducts.map(p => ({ id: p._id, name: p.name, category: p.category})))}
          `,
          config: {
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productIds: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    }
                }
             }
          }
        });
        const result = JSON.parse(response.text);
        return (result.productIds || []) as Id<'products'>[];
    }
});

export const generateReorderSuggestion = internalAction({
    args: {
        productName: v.string(),
        stockLevel: v.number(),
        supplierName: v.string(),
        leadTimeDays: v.optional(v.number()),
    },
    handler: async (_, { productName, stockLevel, supplierName, leadTimeDays }) => {
        const leadTimeInfo = leadTimeDays 
            ? `The supplier, ${supplierName}, has an estimated lead time of ${leadTimeDays} days.`
            : `The supplier is ${supplierName}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The product "${productName}" is low on stock, with only ${stockLevel} units remaining. ${leadTimeInfo} Generate a concise, helpful reorder suggestion. Be direct and actionable.`,
        });
        return response.text;
    }
});

export const getAllProducts = internalQuery({
    handler: (ctx) => ctx.db.query('products').collect(),
});