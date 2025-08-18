import { GoogleGenAI } from '@google/genai';
import { v } from 'convex/values';
import { action } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});  
;




export const generateServiceDescription = action({
  args: { serviceName: v.string() },
  handler: async (ctx, { serviceName }) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a compelling, customer-facing description for an auto detailing service named "${serviceName}". Keep it concise (2-3 sentences) and highlight the key benefits.`,
    });
    return response.text;
  },
});

export const suggestQuoteFromPhotos = action({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, { storageIds }) => {
    const services = await ctx.runQuery(api.services.getAll);
    const upcharges = await ctx.runQuery(api.pricing.getAllUpcharges);
    if (!services || !upcharges) {
      throw new Error('Could not fetch services or upcharges.');
    }

    const imageUrls = await Promise.all(
      storageIds.map((id) => ctx.runQuery(api.files.getUrl, { storageId: id }))
    );

    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        if (!url) {
          throw new Error('Image URL not found');
        }
        const response = await fetch(url);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        return {
          inlineData: {
            mimeType: blob.type,
            data: Buffer.from(buffer).toString('base64'),
          },
        };
      })
    );

    const prompt = `Analyze these photos of a vehicle that needs detailing. Based on the visible condition (dirt, swirls, stains, etc.), suggest a quote.

    Respond in JSON format. The JSON object should have two keys: "suggestedServiceIds" and "suggestedUpchargeIds".

    - "suggestedServiceIds": An array of service IDs that are most appropriate.
    - "suggestedUpchargeIds": An array of upcharge IDs for things like "Excessive Pet Hair" or "Heavy Stains".

    Available Services:
    ${JSON.stringify(
      services.map((s) => ({
        id: s._id,
        name: s.name,
        description: s.description,
      }))
    )}

    Available Upcharges:
    ${JSON.stringify(
      upcharges.map((u) => ({
        id: u._id,
        name: u.name,
        description: u.description,
      }))
    )}

    Analyze the images carefully and select the most relevant services and upcharges. For example, if you see a lot of dog hair on the seats, include the "Excessive Pet Hair" upcharge. If the paint looks dull and scratched, suggest a paint correction service.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, { text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });
    if (response.text) {
      return JSON.parse(response.text);
    } else {
      throw new Error('Failed to generate content');
    }
  },
});

export const suggestAppointmentSlots = action({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.runQuery(api.jobs.get, { id: jobId });
    const allAppointments = await ctx.runQuery(api.appointments.getAll);
    const allServices = await ctx.runQuery(api.services.getAll);
    if (!job || !allAppointments || !allServices) {
      return null;
    }

    const jobDurationHours = job.jobItems.reduce((total, item) => {
      const service = allServices.find((s) => s._id === item.serviceId);
      return total + (service?.estimatedDurationHours || 2);
    }, 0);

    const prompt = `I need to schedule a new detailing job that will take approximately ${jobDurationHours} hours.
        My typical business hours are Monday-Friday 9am to 5pm.
        
        Here is a list of my currently scheduled appointments in UTC timestamps:
        ${JSON.stringify(
      allAppointments.map((a) => ({ start: a.startTime, end: a.endTime }))
    )}

        Based on this, suggest three optimal, non-overlapping appointment slots for the new job in the near future (within the next two weeks). Provide the start and end times for each slot.
        
        Respond ONLY with a JSON array of objects, where each object has "startTime" and "endTime" as ISO 8601 strings. Do not include any other text or explanation.
        Example: [{"startTime": "2024-08-15T13:00:00.000Z", "endTime": "2024-08-15T17:00:00.000Z"}]
        `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    if (response.text) {
      return JSON.parse(response.text);
    } else {
      throw new Error('Failed to generate content');
    }
  },
});

export const generateCampaignContent = action({
  args: { goal: v.string() },
  handler: async (ctx, { goal }) => {
    const company = await ctx.runQuery(api.company.get);

    const prompt = `I am the owner of an auto detailing business called "${company?.name || 'Detailing Pro'
      }".
        I want to create an email marketing campaign with the following goal: "${goal}".
        
        Please generate a compelling subject line and email body for this campaign. The tone should be professional but friendly.
        
        Respond ONLY with a JSON object with two keys: "subject" and "body". The body should be a single string with newline characters (\\n) for paragraphs.
        `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    if (!response.text) {
      throw new Error('Failed to generate content');
    } else {
      return JSON.parse(response.text);
    }
  },
});