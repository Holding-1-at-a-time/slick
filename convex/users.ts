import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

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

export const getByIdentity = internalQuery({
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
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!currentUser) return null;

    const allJobs = await ctx.db.query("jobs").order("desc").collect();

    // Technician Path
    if (currentUser.role === "technician") {
      const techJobs = allJobs.filter((j) =>
        j.assignedTechnicianIds?.includes(currentUser._id)
      );

      const jobsWithDetails = await Promise.all(
        techJobs.map(async (job) => {
          const customer = await ctx.db.get(job.customerId);
          const vehicle = await ctx.db.get(job.vehicleId);
          return { ...job, customer, vehicle };
        })
      );
      
      const stats = {
        activeJobs: techJobs.filter((j) =>
          ["workOrder", "invoice"].includes(j.status)
        ).length,
      };

      return {
        stats,
        jobsForDashboard: jobsWithDetails,
        adminDashboardData: null,
      };
    }

    // Admin Path
    const recentJobsForList = allJobs.slice(0, 10);
    const jobsWithDetails = await Promise.all(
      recentJobsForList.map(async (job) => {
        const customer = await ctx.db.get(job.customerId);
        const vehicle = await ctx.db.get(job.vehicleId);
        return { ...job, customer, vehicle };
      })
    );

    const allCustomers = await ctx.db.query("customers").collect();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const jobsLastMonth = allJobs.filter(
      (j) =>
        j.status === "completed" &&
        j.completionDate &&
        j.completionDate > oneMonthAgo.getTime()
    );
    const revenueThisMonth = jobsLastMonth.reduce(
      (sum, j) => sum + j.totalAmount,
      0
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const appointmentsToday = (
      await ctx.db.query("appointments").collect()
    ).filter(
      (a) =>
        a.startTime >= todayStart.getTime() && a.startTime <= todayEnd.getTime()
    ).length;

    const lowStockItems = (await ctx.db.query("products").collect()).filter(
      (p) => p.stockLevel <= p.reorderPoint
    ).length;

    const allServices = await ctx.db.query("services").collect();
    const revenueByService: Record<string, number> = {};
    jobsLastMonth.forEach((job) => {
      job.jobItems.forEach((item) => {
        const service = allServices.find((s) => s._id === item.serviceId);
        if (service) {
          const serviceName = service.name;
          revenueByService[serviceName] =
            (revenueByService[serviceName] || 0) + item.total;
        }
      });
    });

    const sortedRevenueByService = Object.entries(revenueByService)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const revenueByServiceChartData = {
      labels: sortedRevenueByService.map((item) => item[0]),
      data: sortedRevenueByService.map((item) => item[1]),
    };

    const stats = {
      activeJobs: allJobs.filter((j) =>
        ["workOrder", "invoice"].includes(j.status)
      ).length,
      revenueThisMonth,
      totalCustomers: allCustomers.length,
      appointmentsToday,
      lowStockItems,
    };

    return {
      stats,
      jobsForDashboard: jobsWithDetails,
      adminDashboardData: { revenueByServiceChartData },
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