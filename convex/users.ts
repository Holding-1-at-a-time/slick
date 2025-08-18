import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getSettingsData = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        
        const currentUser = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser || currentUser.role !== 'admin') {
            return { currentUser, allUsers: currentUser ? [currentUser] : [], company: null };
        }

        const allUsers = await ctx.db.query("users").collect();
        const company = await ctx.db.query("company").first();

        return { currentUser, allUsers, company };
    },
});

export const getDashboardData = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const currentUser = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser) return null;
        
        let jobsForCurrentUserQuery = ctx.db.query("jobs").order('desc');
        if(currentUser.role === 'technician') {
            const technicianId = currentUser._id;
            jobsForCurrentUserQuery = jobsForCurrentUserQuery.filter(q => 
                q.or(
                    q.eq(q.field("assignedTechnicianIds"), [technicianId]),
                    q.eq(q.field("assignedTechnicianIds"), technicianId)
                )
            );
        }
        const jobsForCurrentUser = await jobsForCurrentUserQuery.collect();
        
        const jobsWithDetails = await Promise.all(jobsForCurrentUser.map(async (job) => {
            const customer = await ctx.db.get(job.customerId);
            const vehicle = await ctx.db.get(job.vehicleId);
            return { ...job, customer, vehicle };
        }));

        // Stats are always calculated across the whole business
        const allJobs = await ctx.db.query("jobs").collect();
        const allCustomers = await ctx.db.query("customers").collect();

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const revenueThisMonth = allJobs
            .filter(j => j.status === 'completed' && j.completionDate && j.completionDate > oneMonthAgo.getTime())
            .reduce((sum, j) => sum + j.totalAmount, 0);

        const stats = {
            activeJobs: allJobs.filter(j => ['workOrder', 'invoice'].includes(j.status)).length,
            revenueThisMonth,
            totalCustomers: allCustomers.length,
        };

        return {
            stats,
            jobsForCurrentUser: jobsWithDetails,
        };
    },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('technician')),
  },
  handler: async (ctx, args) => {
    // This function is a placeholder for a real implementation that would invite users via Clerk.
    // Directly creating users here is not recommended as they won't have a Clerk account to log in.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique();
    if (currentUser?.role !== 'admin') throw new Error("Not authorized");

    console.warn("User creation without a Clerk invitation is not fully supported.");
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('technician')),
  },
  handler: async (ctx, { id, ...rest }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique();
    if (currentUser?.role !== 'admin') throw new Error("Not authorized");

    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const currentUser = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique();
    if (currentUser?.role !== 'admin') throw new Error("Not authorized");
    if (currentUser._id === id) throw new Error("Cannot delete yourself");
    
    // In a real app, you would also trigger a Clerk user deletion via API.
    await ctx.db.delete(id);
  },
});

// Internal mutations for Clerk webhooks
export const createOrUpdate = internalMutation({
  args: { clerkUser: v.any() },
  handler: async (ctx, { clerkUser }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUser.id))
      .unique();

    const userData = {
      name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || clerkUser.email_addresses[0].email_address,
      email: clerkUser.email_addresses[0].email_address,
      clerkId: clerkUser.id,
    };

    if (user === null) {
      const anyUser = await ctx.db.query("users").first();
      await ctx.db.insert("users", {
        ...userData,
        role: anyUser ? "technician" : "admin",
      });

      if (!anyUser) {
        await ctx.db.insert("company", {
          name: `${userData.name}'s Detailing`,
          defaultLaborRate: 75,
        });
      }
    } else {
      await ctx.db.patch(user._id, { name: userData.name, email: userData.email });
    }
  },
});

export const deleteClerkUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
