import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { productStockStatusAggregate } from './aggregates';

export const getData = query({
    handler: async (ctx) => {
        const products = await ctx.db.query('products').collect();
        const suppliers = await ctx.db.query('suppliers').collect();
        return { products, suppliers };
    }
});

export const getLogsForProduct = query({
    args: { productId: v.id('products') },
    handler: async (ctx, { productId }) => {
        return await ctx.db.query('inventoryLog').withIndex('by_product', q => q.eq('productId', productId)).order('desc').collect();
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
        const productId = await ctx.db.insert('products', args);
        const newDoc = await ctx.db.get(productId);
        if (newDoc) {
            await productStockStatusAggregate.insert(ctx, newDoc);
        }
        return productId;
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
        const oldDoc = await ctx.db.get(id);
        if (!oldDoc) throw new Error("Product not found");

        await ctx.db.patch(id, rest);

        const newDoc = await ctx.db.get(id);
        if (newDoc) {
            await productStockStatusAggregate.replace(ctx, oldDoc, newDoc);
        }
    }
});

export const deleteProduct = mutation({
    args: { id: v.id('products') },
    handler: async (ctx, { id }) => {
        const oldDoc = await ctx.db.get(id);
        if (!oldDoc) return;
        
        await ctx.db.delete(id);
        await productStockStatusAggregate.delete(ctx, oldDoc);
    }
});

export const receiveStock = mutation({
    args: {
        productId: v.id('products'),
        quantity: v.number(),
        costPerUnit: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, { productId, quantity, costPerUnit, notes }) => {
        const oldDoc = await ctx.db.get(productId);
        if (!oldDoc) throw new Error("Product not found");

        const newStockLevel = oldDoc.stockLevel + quantity;
        await ctx.db.patch(productId, { stockLevel: newStockLevel, lastCostPerUnit: costPerUnit });
        
        await ctx.db.insert('inventoryLog', {
            productId,
            change: quantity,
            newStockLevel,
            type: 'received',
            costPerUnit,
            notes,
            timestamp: Date.now(),
        });
        
        const newDoc = await ctx.db.get(productId);
        if (newDoc) {
            await productStockStatusAggregate.replace(ctx, oldDoc, newDoc);
        }
    }
});

export const debitInventoryForJob = internalMutation({
    args: { jobId: v.id('jobs') },
    handler: async (ctx, { jobId }) => {
        const job = await ctx.db.get(jobId);
        if (!job || job.inventoryDebited) return;

        const services = await ctx.db.query('services').collect();
        
        const productsToDebit = new Map<Id<'products'>, number>();
        job.jobItems.forEach(item => {
            const service = services.find(s => s._id === item.serviceId);
            service?.productsUsed?.forEach(pu => {
                productsToDebit.set(pu.productId, (productsToDebit.get(pu.productId) || 0) + pu.quantity);
            });
        });

        for (const [productId, quantity] of productsToDebit.entries()) {
            const oldProductDoc = await ctx.db.get(productId);
            if (oldProductDoc) {
                const newStockLevel = oldProductDoc.stockLevel - quantity;
                await ctx.db.patch(productId, { stockLevel: newStockLevel });
                await ctx.db.insert('inventoryLog', {
                    productId,
                    change: -quantity,
                    newStockLevel,
                    type: 'job_deduction',
                    jobId,
                    timestamp: Date.now(),
                });
                
                const newProductDoc = await ctx.db.get(productId);
                if (newProductDoc) {
                    await productStockStatusAggregate.replace(ctx, oldProductDoc, newProductDoc);
                }
            }
        }
        await ctx.db.patch(jobId, { inventoryDebited: true });
    }
});