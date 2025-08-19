import { v } from 'convex/values';
import { query, action, mutation } from './_generated/server';
import { api } from './_generated/api';
import { rateLimiter } from './rateLimiter';

export const getPublicServices = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("services")
            .filter(q => q.eq(q.field("isDealerPackage"), false))
            .collect();
    }
});

export const getAvailableSlots = action({
    args: {
        date: v.string(), // YYYY-MM-DD
        totalDurationMinutes: v.number(),
    },
    handler: async (ctx, { date, totalDurationMinutes }) => {
        const company = await ctx.runQuery(api.company.get);
        if (!company?.businessHours) {
            throw new Error("Business hours are not configured.");
        }

        const slotDuration = company.slotDurationMinutes || 30;
        const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        
        const hours = company.businessHours[dayOfWeek];
        if (!hours || !hours.enabled) {
            return []; // Closed on this day
        }

        const [startHour, startMinute] = hours.start.split(':').map(Number);
        const [endHour, endMinute] = hours.end.split(':').map(Number);

        const dayStart = new Date(date);
        dayStart.setUTCHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(date);
        dayEnd.setUTCHours(endHour, endMinute, 0, 0);

        const appointments = await ctx.runQuery(api.appointments.getAll);
        const appointmentsOnDate = appointments.filter(a => {
            const apptDate = new Date(a.startTime).toISOString().split('T')[0];
            return apptDate === date;
        });

        const availableSlots: string[] = [];
        let currentSlotTime = dayStart.getTime();

        while (currentSlotTime < dayEnd.getTime()) {
            const slotStart = currentSlotTime;
            const slotEnd = slotStart + totalDurationMinutes * 60 * 1000;

            if (slotEnd > dayEnd.getTime()) {
                break; // Not enough time left in the day
            }
            
            let isAvailable = true;
            for (const appt of appointmentsOnDate) {
                if (slotStart < appt.endTime && slotEnd > appt.startTime) {
                    isAvailable = false;
                    break;
                }
            }

            if (isAvailable) {
                availableSlots.push(new Date(slotStart).toISOString());
            }

            currentSlotTime += slotDuration * 60 * 1000;
        }

        return availableSlots;
    }
});


export const createBooking = mutation({
    args: {
        customerInfo: v.object({ name: v.string(), email: v.string(), phone: v.string() }),
        vehicleInfo: v.object({ make: v.string(), model: v.string(), year: v.number(), color: v.string() }),
        serviceIds: v.array(v.id('services')),
        startTime: v.number(),
        totalPrice: v.number(),
        totalDurationMinutes: v.number(),
    },
    handler: async (ctx, { customerInfo, vehicleInfo, serviceIds, startTime, totalPrice, totalDurationMinutes }) => {
        // Apply rate limiting to the public endpoint.
        await rateLimiter.limit(ctx, "publicBooking", { throws: true });

        // 1. Find or create customer
        let customerId = await ctx.db.query('customers').withIndex('by_email', q => q.eq('email', customerInfo.email)).first().then(c => c?._id);
        if (!customerId) {
            customerId = await ctx.db.insert('customers', customerInfo);
        }

        // 2. Create vehicle (simplified: assumes new vehicle for each booking for now)
        const vehicleId = await ctx.db.insert('vehicles', { ...vehicleInfo, customerId, vin: 'N/A_OnlineBooking' });

        // 3. Create job items
        const services = await Promise.all(serviceIds.map(id => ctx.db.get(id)));
        const jobItems = services.map(service => {
            if (!service) throw new Error("Service not found");
            return {
                id: `item_${Date.now()}_${service._id}`,
                serviceId: service._id,
                quantity: 1,
                unitPrice: service.basePrice,
                appliedPricingRuleIds: [],
                addedUpchargeIds: [],
                total: service.basePrice,
            };
        });

        // 4. Create job
        const jobId = await ctx.db.insert('jobs', {
            customerId,
            vehicleId,
            status: 'workOrder',
            estimateDate: Date.now(),
            workOrderDate: Date.now(),
            totalAmount: totalPrice,
            paymentReceived: 0,
            paymentStatus: 'unpaid',
            jobItems,
            customerApprovalStatus: 'approved',
            notes: 'Booked online by customer.',
            inventoryDebited: false,
        });

        // 5. Create appointment
        await ctx.db.insert('appointments', {
            jobId,
            startTime,
            endTime: startTime + totalDurationMinutes * 60 * 1000,
            status: 'scheduled',
            description: 'Online Booking',
        });
        
        return { success: true, jobId };
    }
});