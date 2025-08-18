import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { customAlphabet } from 'nanoid';
import { retrier } from './retrier';
import { internal } from './_generated/api';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

// --- Queries ---

export const get = query({
    args: { id: v.id('jobs') },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    }
});

export const getDataForForm = query({
    handler: async (ctx) => {
        const customers = await ctx.db.query("customers").collect();
        const vehicles = await ctx.db.query("vehicles").collect();
        const services = await ctx.db.query("services").collect();
        const pricingMatrices = await ctx.db.query("pricingMatrices").collect();
        const upcharges = await ctx.db.query("upcharges").collect();
        const promotions = await ctx.db.query("promotions").collect();
        return { customers, vehicles, services, pricingMatrices, upcharges, promotions };
    }
});

export const getDataForDetailPage = query({
    args: { jobId: v.id('jobs') },
    handler: async (ctx, { jobId }) => {
        const job = await ctx.db.get(jobId);
        if (!job) return null;
        
        const customer = await ctx.db.get(job.customerId);
        if (!customer) return null;

        const vehicle = await ctx.db.get(job.vehicleId);
        if (!vehicle) return null;
        
        const services = await ctx.db.query('services').collect();
        const checklists = await ctx.db.query('checklists').collect();
        
        const photoUrls = await Promise.all(
            (job.photos || []).map(async (p) => ({
                id: p.id,
                url: await ctx.storage.getUrl(p.storageId),
                type: p.type,
            }))
        );

        const signatureUrl = job.customerSignatureStorageId ? await ctx.storage.getUrl(job.customerSignatureStorageId) : null;

        return { job, customer, vehicle, services, checklists, photoUrls, signatureUrl };
    }
});

export const getJobItem = query({
    args: { jobItemId: v.string() },
    handler: async (ctx, { jobItemId }) => {
        const jobs = await ctx.db.query('jobs').collect();
        for (const job of jobs) {
            const item = job.jobItems.find(i => i.id === jobItemId);
            if (item) return item;
        }
        return null;
    }
});

export const getDataForCustomerPortal = query({
    args: { key: v.string() },
    handler: async (ctx, { key }) => {
        const job = await ctx.db.query('jobs').withIndex('by_public_link_key', q => q.eq('publicLinkKey', key)).first();
        if (!job) return { job: null };

        const customer = await ctx.db.get(job.customerId);
        if (!customer) throw new Error("Customer not found for job");

        const vehicle = await ctx.db.get(job.vehicleId);
        if (!vehicle) throw new Error("Vehicle not found for job");
        
        const services = await ctx.db.query('services').collect();
        const photoUrls = await Promise.all(
            (job.photos || []).map(async (p) => ({ id: p.id, url: await ctx.storage.getUrl(p.storageId), type: p.type }))
        );
        const signatureUrl = job.customerSignatureStorageId ? await ctx.storage.getUrl(job.customerSignatureStorageId) : null;

        return { job, customer, vehicle, services, photoUrls, signatureUrl };
    }
});

// --- Mutations ---

export const save = mutation({
    args: {
        id: v.optional(v.id('jobs')),
        customerId: v.id('customers'),
        vehicleId: v.id('vehicles'),
        status: v.union(v.literal('estimate'), v.literal('workOrder'), v.literal('invoice'), v.literal('completed'), v.literal('cancelled')),
        estimateDate: v.number(),
        notes: v.optional(v.string()),
        appliedPromotionId: v.optional(v.id('promotions')),
        discountAmount: v.number(),
        totalAmount: v.number(),
        jobItems: v.array(v.object({
            id: v.string(), serviceId: v.id('services'), quantity: v.number(), unitPrice: v.number(),
            appliedPricingRuleIds: v.array(v.string()), addedUpchargeIds: v.array(v.id('upcharges')),
            total: v.number()
        })),
    },
    handler: async (ctx, { id, ...data }) => {
        if (id) {
            const existingJob = await ctx.db.get(id);
            const updatedJobItems = data.jobItems.map(newItem => {
                const existingItem = existingJob?.jobItems.find(i => i.id === newItem.id);
                return {
                    ...newItem,
                    checklistCompletedItems: existingItem?.checklistCompletedItems,
                };
            });
            await ctx.db.patch(id, {...data, jobItems: updatedJobItems});
            return id;
        } else {
            return await ctx.db.insert('jobs', {
                ...data,
                workOrderDate: data.status === 'workOrder' ? Date.now() : undefined,
                invoiceDate: data.status === 'invoice' ? Date.now() : undefined,
                completionDate: data.status === 'completed' ? Date.now() : undefined,
                paymentReceived: 0,
                paymentStatus: 'unpaid',
                customerApprovalStatus: 'pending',
                publicLinkKey: nanoid(),
            });
        }
    }
});

export const createDraft = mutation({
    args: {
        customerId: v.id('customers'),
        vehicleId: v.id('vehicles'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('jobs', {
            ...args,
            status: 'estimate',
            estimateDate: Date.now(),
            totalAmount: 0,
            paymentReceived: 0,
            paymentStatus: 'unpaid',
            jobItems: [],
            customerApprovalStatus: 'pending',
            publicLinkKey: nanoid(),
        });
    }
});

export const initiateVisualQuote = mutation({
    args: {
        jobId: v.id('jobs'),
        storageIds: v.array(v.id('_storage')),
    },
    handler: async (ctx, { jobId, storageIds }) => {
        await ctx.db.patch(jobId, {
            visualQuoteStatus: 'pending',
            visualQuoteStorageIds: storageIds,
            jobItems: [],
            totalAmount: 0,
            discountAmount: 0,
        });
        await retrier.run(ctx, internal.ai.suggestQuoteFromPhotos, { jobId });
    }
});

export const updateVisualQuoteSuccess = internalMutation({
    args: {
        jobId: v.id('jobs'),
        suggestedServiceIds: v.array(v.id('services')),
        suggestedUpchargeIds: v.array(v.id('upcharges')),
    },
    handler: async (ctx, { jobId, suggestedServiceIds, suggestedUpchargeIds }) => {
        const services = await ctx.db.query('services').collect();
        const upcharges = await ctx.db.query('upcharges').collect();

        const newJobItems: any[] = suggestedServiceIds.map(serviceId => {
            const service = services.find(s => s._id === serviceId);
            if (!service) return null;
            return {
                id: `item_${Date.now()}_${serviceId}`,
                serviceId,
                quantity: 1,
                unitPrice: service.basePrice,
                appliedPricingRuleIds: [],
                addedUpchargeIds: [],
                total: service.basePrice,
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        if (newJobItems.length > 0 && suggestedUpchargeIds.length > 0) {
            newJobItems[0].addedUpchargeIds.push(...suggestedUpchargeIds);
        }
        
        for (const item of newJobItems) {
            let itemTotal = item.unitPrice;
            for (const upchargeId of item.addedUpchargeIds) {
                const upcharge = upcharges.find(u => u._id === upchargeId);
                if (upcharge) {
                    itemTotal += upcharge.isPercentage ? itemTotal * (upcharge.defaultAmount / 100) : upcharge.defaultAmount;
                }
            }
            item.total = itemTotal;
        }

        const totalAmount = newJobItems.reduce((sum, item) => sum + item.total, 0);

        await ctx.db.patch(jobId, {
            jobItems: newJobItems,
            visualQuoteStatus: 'complete',
            totalAmount,
        });
    }
});

export const updateVisualQuoteFailure = internalMutation({
    args: { jobId: v.id('jobs') },
    handler: async (ctx, { jobId }) => {
        await ctx.db.patch(jobId, { visualQuoteStatus: 'failed' });
    }
});


export const remove = mutation({
    args: { id: v.id('jobs') },
    handler: async (ctx, { id }) => await ctx.db.delete(id),
});

export const convertToWorkOrder = mutation({
    args: { id: v.id('jobs') },
    handler: async (ctx, { id }) => await ctx.db.patch(id, { status: 'workOrder', workOrderDate: Date.now() }),
});

export const generateInvoice = mutation({
    args: { id: v.id('jobs') },
    handler: async (ctx, { id }) => await ctx.db.patch(id, { status: 'invoice', invoiceDate: Date.now() }),
});

export const savePayment = mutation({
    args: {
        jobId: v.id('jobs'),
        payment: v.object({ amount: v.number(), paymentDate: v.number(), method: v.string(), notes: v.optional(v.string()) })
    },
    handler: async (ctx, { jobId, payment }) => {
        const job = await ctx.db.get(jobId);
        if (!job) throw new Error("Job not found");
        
        const newPayment = { ...payment, id: `pay_${Date.now()}`};
        const payments = [...(job.payments || []), newPayment];
        const paymentReceived = payments.reduce((sum, p) => sum + p.amount, 0);
        
        let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'partial';
        if (paymentReceived >= job.totalAmount) paymentStatus = 'paid';
        if (paymentReceived <= 0) paymentStatus = 'unpaid';

        const status = paymentStatus === 'paid' ? 'completed' : job.status;
        const completionDate = paymentStatus === 'paid' ? Date.now() : job.completionDate;

        await ctx.db.patch(jobId, { payments, paymentReceived, paymentStatus, status, completionDate });
    }
});

export const updateChecklistProgress = mutation({
    args: { jobItemId: v.string(), completedTasks: v.array(v.string()) },
    handler: async (ctx, { jobItemId, completedTasks }) => {
        const jobs = await ctx.db.query('jobs').collect();
        for (const job of jobs) {
            const itemIndex = job.jobItems.findIndex(i => i.id === jobItemId);
            if (itemIndex > -1) {
                const newItems = [...job.jobItems];
                newItems[itemIndex].checklistCompletedItems = completedTasks;
                await ctx.db.patch(job._id, { jobItems: newItems });
                return;
            }
        }
    }
});

export const addPhoto = mutation({
    args: { jobId: v.id('jobs'), storageId: v.id('_storage'), type: v.union(v.literal('before'), v.literal('after')) },
    handler: async (ctx, { jobId, storageId, type }) => {
        const job = await ctx.db.get(jobId);
        if (!job) throw new Error("Job not found");
        const newPhoto = { id: `photo_${Date.now()}`, storageId, type, timestamp: Date.now() };
        await ctx.db.patch(jobId, { photos: [...(job.photos || []), newPhoto] });
    }
});

export const approveJob = mutation({
    args: { jobId: v.id('jobs'), signatureStorageId: v.id('_storage') },
    handler: async (ctx, { jobId, signatureStorageId }) => {
        await ctx.db.patch(jobId, {
            customerApprovalStatus: 'approved',
            customerSignatureStorageId: signatureStorageId,
            approvalTimestamp: Date.now()
        });
    }
});