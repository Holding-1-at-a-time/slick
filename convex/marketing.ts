import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { retrier } from './retrier';

export const getData = query({
    handler: async (ctx) => {
        const promotions = await ctx.db.query('promotions').collect();
        const campaigns = await ctx.db.query('campaigns').order('desc').collect();
        return { promotions, campaigns };
    }
});

export const savePromotion = mutation({
    args: {
        id: v.optional(v.id('promotions')),
        data: v.object({
            code: v.string(),
            type: v.union(v.literal('percentage'), v.literal('fixedAmount')),
            value: v.number(),
            isActive: v.boolean(),
        })
    },
    handler: async (ctx, { id, data }) => {
        if (id) {
            await ctx.db.patch(id, data);
        } else {
            await ctx.db.insert('promotions', data);
        }
    }
});

export const deletePromotion = mutation({
    args: { id: v.id('promotions') },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    }
});

export const saveCampaign = mutation({
    args: {
        id: v.optional(v.id('campaigns')),
        data: v.object({
            goal: v.string(),
            subject: v.optional(v.string()),
            body: v.optional(v.string()),
        })
    },
    handler: async (ctx, { id, data }) => {
        if (id) {
            // Standard edit for a campaign that's already been generated.
            await ctx.db.patch(id, { goal: data.goal, subject: data.subject, body: data.body });
        } else {
            // New campaign: create a placeholder and kick off the resilient generation.
            const campaignId = await ctx.db.insert('campaigns', {
                goal: data.goal,
                createdAt: Date.now(),
                status: 'generating',
            });
            await retrier.run(ctx, internal.ai.generateCampaignContent, {
                goal: data.goal,
                campaignId,
            });
        }
    }
});

export const updateGeneratedCampaignContent = internalMutation({
    args: {
        campaignId: v.id('campaigns'),
        subject: v.string(),
        body: v.string(),
    },
    handler: async (ctx, { campaignId, subject, body }) => {
        await ctx.db.patch(campaignId, {
            subject,
            body,
            status: 'complete',
        });
    }
});

export const failCampaignGeneration = internalMutation({
    args: { campaignId: v.id('campaigns') },
    handler: async (ctx, { campaignId }) => {
        await ctx.db.patch(campaignId, {
            status: 'failed',
            subject: 'Content Generation Failed',
            body: 'There was an error generating the content for this campaign. Please try creating a new one or edit this one manually.'
        });
    }
});