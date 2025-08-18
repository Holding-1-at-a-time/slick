import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getData = query({
    handler: async (ctx) => {
        const products = await ctx.db.query('products').collect();
        const suppliers = await ctx.db.query('suppliers').collect();
        return { products, suppliers };
    }
});

export const createProduct = mutation({
    args: {
        name: v.string(),
        category: v.string(),
        supplierId: v.id('suppliers'),
        stockLevel: v.number(),
        reorderPoint: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('products', args);
    }
});

export const updateProduct = mutation({
    args: {
        id: v.id('products'),
        name: v.string(),
        category: v.string(),
        supplierId: v.id('suppliers'),
        stockLevel: v.number(),
        reorderPoint: v.number(),
    },
    handler: async (ctx, { id, ...rest }) => {
        return await ctx.db.patch(id, rest);
    }
});

export const deleteProduct = mutation({
    args: { id: v.id('products') },
    handler: async (ctx, { id }) => {
        return await ctx.db.delete(id);
    }
});
