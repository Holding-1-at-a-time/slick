import { v } from 'convex/values';
import { query } from './_generated/server';

export const getReportsData = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
        technicianId: v.string(),
    },
    handler: async (ctx, { startDate, endDate, technicianId }) => {
        const allJobs = await ctx.db.query('jobs').filter(q => 
            q.and(
                q.gte(q.field('completionDate'), startDate),
                q.lte(q.field('completionDate'), endDate),
                q.eq(q.field('status'), 'completed')
            )
        ).collect();
        
        const filteredJobs = technicianId === 'all' 
            ? allJobs 
            : allJobs.filter(job => job.assignedTechnicianIds?.includes(technicianId as any));

        // Revenue over time
        const dailyRevenue: { [key: string]: number } = {};
        for (const job of filteredJobs) {
            const date = new Date(job.completionDate!).toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + job.totalAmount;
        }
        const sortedDates = Object.keys(dailyRevenue).sort();
        const revenueOverTime = {
            labels: sortedDates,
            data: sortedDates.map(date => dailyRevenue[date])
        };
        
        // Service performance
        const allServices = await ctx.db.query('services').collect();
        const servicePerf: { [key: string]: { count: number, revenue: number } } = {};
        for (const job of filteredJobs) {
            for (const item of job.jobItems) {
                if (!servicePerf[item.serviceId]) servicePerf[item.serviceId] = { count: 0, revenue: 0 };
                servicePerf[item.serviceId].count += 1;
                servicePerf[item.serviceId].revenue += item.total;
            }
        }
        const servicePerformance = Object.entries(servicePerf).map(([serviceId, data]) => ({
            service: allServices.find(s => s._id === serviceId)!,
            ...data
        })).sort((a,b) => b.revenue - a.revenue);

        // Technician leaderboard
        const technicians = await ctx.db.query('users').filter(q => q.eq(q.field('role'), 'technician')).collect();
        const techLeaderboard: { [key: string]: { completedJobs: number, revenue: number } } = {};
        for (const tech of technicians) {
            techLeaderboard[tech._id] = { completedJobs: 0, revenue: 0 };
        }
        for (const job of allJobs) {
            job.assignedTechnicianIds?.forEach(id => {
                if(techLeaderboard[id]) {
                    techLeaderboard[id].completedJobs += 1;
                    techLeaderboard[id].revenue += job.totalAmount; // This might over-attribute revenue
                }
            })
        }
        const technicianLeaderboard = Object.entries(techLeaderboard).map(([techId, data]) => ({
            technician: technicians.find(t => t._id === techId)!,
            ...data,
            averageJobValue: data.completedJobs > 0 ? data.revenue / data.completedJobs : 0
        })).sort((a, b) => b.revenue - a.revenue);

        return { revenueOverTime, servicePerformance, technicianLeaderboard, technicians };
    }
});

export const getVehicleHistory = query({
    args: { query: v.string() },
    handler: async (ctx, { query }) => {
        // This is a simplified search. A real implementation might use a more robust search index.
        const lowerQuery = query.toLowerCase();
        const allVehicles = await ctx.db.query('vehicles').collect();
        const allCustomers = await ctx.db.query('customers').collect();
        
        const vehicle = allVehicles.find(v => 
            v.vin.toLowerCase().includes(lowerQuery) ||
            v.make.toLowerCase().includes(lowerQuery) ||
            v.model.toLowerCase().includes(lowerQuery) ||
            (allCustomers.find(c => c._id === v.customerId)?.name.toLowerCase().includes(lowerQuery))
        );
        if (!vehicle) return null;
        
        const jobs = await ctx.db.query('jobs').withIndex('by_customer', q => q.eq('customerId', vehicle.customerId)).filter(q => q.eq(q.field('vehicleId'), vehicle._id)).order('desc').collect();
        const allServices = await ctx.db.query('services').collect();
        const jobsWithServices = jobs.map(job => ({
            ...job,
            serviceNames: job.jobItems.map(item => allServices.find(s => s._id === item.serviceId)?.name || 'Unknown')
        }));

        const customer = allCustomers.find(c => c._id === vehicle.customerId);
        
        return {
            vehicle,
            customerName: customer?.name || 'Unknown',
            jobs: jobsWithServices
        };
    }
});
