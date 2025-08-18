import { query } from "./_generated/server";

export const getPageData = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        
        const services = await ctx.db.query("services").collect();
        const pricingMatrices = await ctx.db.query("pricingMatrices").collect();
        const upcharges = await ctx.db.query("upcharges").collect();
        const checklists = await ctx.db.query("checklists").collect();
        const customers = await ctx.db.query("customers").collect();
        const vehicles = await ctx.db.query("vehicles").collect();
        const jobs = await ctx.db.query("jobs").order("desc").collect();
        const appointments = await ctx.db.query("appointments").collect();

        return { services, pricingMatrices, upcharges, checklists, customers, vehicles, jobs, appointments };
    }
});
