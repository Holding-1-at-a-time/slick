import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getAll = query({
    handler: async (ctx) => {
        return await ctx.db.query('appointments').collect();
    }
});

export const getScheduleData = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const currentUser = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser) return null;

        const allJobs = await ctx.db.query('jobs').collect();
        let jobsForCurrentUser = allJobs;
        if (currentUser.role === 'technician') {
             jobsForCurrentUser = allJobs.filter(job => job.assignedTechnicianIds?.includes(currentUser._id));
        }

        const jobIds = new Set(jobsForCurrentUser.map(j => j._id));
        const appointmentsForCurrentUser = (await ctx.db.query('appointments').collect()).filter(a => jobIds.has(a.jobId));
        
        const customerIds = new Set(jobsForCurrentUser.map(j => j.customerId));
        const vehicleIds = new Set(jobsForCurrentUser.map(j => j.vehicleId));
        
        const customers = await Promise.all(Array.from(customerIds).map(id => ctx.db.get(id)));
        const vehicles = await Promise.all(Array.from(vehicleIds).map(id => ctx.db.get(id)));

        return {
            appointmentsForCurrentUser,
            jobsForCurrentUser,
            customers: customers.filter(Boolean),
            vehicles: vehicles.filter(Boolean),
        };
    }
});

export const getDataForForm = query({
    handler: async (ctx) => {
        const jobs = await ctx.db.query('jobs').filter(q => q.neq(q.field('status'), 'completed')).collect();
        const jobsWithDetails = await Promise.all(jobs.map(async job => {
            const customer = await ctx.db.get(job.customerId);
            return { ...job, customerName: customer?.name || 'Unknown' };
        }));
        return { jobs: jobsWithDetails };
    }
});

export const save = mutation({
    args: {
        id: v.optional(v.id('appointments')),
        jobId: v.id('jobs'),
        startTime: v.number(),
        endTime: v.number(),
        description: v.optional(v.string()),
        status: v.union(v.literal('scheduled'), v.literal('inProgress'), v.literal('completed'), v.literal('cancelled')),
    },
    handler: async (ctx, { id, ...rest }) => {
        if (id) {
            await ctx.db.patch(id, rest);
        } else {
            await ctx.db.insert('appointments', rest);
        }
    }
});

export const remove = mutation({
    args: { id: v.id('appointments') },
    handler: async (ctx, { id }) => {
        return await ctx.db.delete(id);
    }
});
