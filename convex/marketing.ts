import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

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
            subject: v.string(),
            body: v.string(),
        })
    },
    handler: async (ctx, { id, data }) => {
        if (id) {
            await ctx.db.patch(id, data);
        } else {
            await ctx.db.insert('campaigns', {
                ...data,
                createdAt: Date.now(),
            });
        }
    }
});
