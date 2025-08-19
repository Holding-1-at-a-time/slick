import { v } from 'convex/values';
import { action, internalAction, internalMutation, query, internalQuery } from './_generated/server';
import { api, internal } from './_generated/api';
import { Id } from './_generated/dataModel';

// --- QUERIES ---

export const getHistoryForJob = query({
    args: { jobId: v.id('jobs') },
    handler: async (ctx, { jobId }) => {
        return await ctx.db
            .query('communicationLogs')
            .withIndex('by_job', q => q.eq('jobId', jobId))
            .order('desc')
            .collect();
    }
});

// --- MANUAL MESSAGING ---

export const sendManualEmail = action({
    args: {
        jobId: v.id('jobs'),
        message: v.string(),
    },
    handler: async (ctx, { jobId, message }) => {
        const job = await ctx.runQuery(api.jobs.get, { id: jobId });
        if (!job) throw new Error("Job not found");

        const customer = await ctx.runQuery(api.customers.get, { id: job.customerId });
        if (!customer) throw new Error("Customer not found");

        // In a real app, you would integrate an email service like Resend or SendGrid here.
        console.log(`--- SIMULATING EMAIL ---
        To: ${customer.email}
        Subject: Regarding your service (Job #${job._id.slice(-6)})
        
        ${message}
        -----------------------`);
        
        await ctx.runMutation(internal.communication.logMessage, {
            jobId,
            content: message,
            type: 'manual_message',
        });
    }
});

// --- AUTOMATED REMINDERS ---

export const sendReminders = internalAction({
    handler: async (ctx) => {
        const company = await ctx.runQuery(api.company.get);
        if (!company?.enableEmailReminders) {
            console.log("Email reminders are disabled. Skipping.");
            return;
        }

        const now = Date.now();
        const reminderWindowStart = now + 23.5 * 60 * 60 * 1000; // 23.5 hours from now
        const reminderWindowEnd = now + 24.5 * 60 * 60 * 1000; // 24.5 hours from now

        const appointmentsToRemind = await ctx.runQuery(internal.communication.getAppointmentsForReminder, {
            startTime: reminderWindowStart,
            endTime: reminderWindowEnd,
        });

        for (const appointment of appointmentsToRemind) {
            await ctx.runAction(internal.communication.sendSingleReminder, { appointmentId: appointment._id });
        }
    }
});

export const getAppointmentsForReminder = internalQuery({
    args: { startTime: v.number(), endTime: v.number() },
    handler: async (ctx, { startTime, endTime }) => {
        return await ctx.db
            .query('appointments')
            .filter(q => q.and(
                q.gte(q.field('startTime'), startTime),
                q.lte(q.field('startTime'), endTime),
                q.eq(q.field('reminderSentAt'), undefined),
                q.eq(q.field('status'), 'scheduled')
            ))
            .collect();
    }
});

export const sendSingleReminder = internalAction({
    args: { appointmentId: v.id('appointments') },
    handler: async (ctx, { appointmentId }) => {
        const appointment = await ctx.runQuery(api.appointments.get, { id: appointmentId });
        if (!appointment) return;

        const job = await ctx.runQuery(api.jobs.get, { id: appointment.jobId });
        if (!job) return;

        const customer = await ctx.runQuery(api.customers.get, { id: job.customerId });
        if (!customer) return;

        const reminderMessage = `Hi ${customer.name},\n\nThis is a friendly reminder of your upcoming auto detailing appointment scheduled for ${new Date(appointment.startTime).toLocaleString()}.\n\nWe look forward to seeing you!\n\n- Detailing Pro`;
        
         // In a real app, you would integrate an email service here.
        console.log(`--- SIMULATING REMINDER EMAIL ---
        To: ${customer.email}
        Subject: Appointment Reminder
        
        ${reminderMessage}
        ---------------------------------`);

        await ctx.runMutation(internal.communication.logMessage, {
            jobId: job._id,
            content: reminderMessage,
            type: 'automated_reminder',
            appointmentIdToUpdate: appointmentId,
        });
    }
});

export const logMessage = internalMutation({
    args: {
        jobId: v.id('jobs'),
        content: v.string(),
        type: v.union(v.literal('automated_reminder'), v.literal('manual_message')),
        appointmentIdToUpdate: v.optional(v.id('appointments')),
    },
    handler: async (ctx, { jobId, content, type, appointmentIdToUpdate }) => {
        await ctx.db.insert('communicationLogs', {
            jobId,
            content,
            type,
            method: 'email',
            timestamp: Date.now(),
        });

        if (type === 'automated_reminder' && appointmentIdToUpdate) {
            await ctx.db.patch(appointmentIdToUpdate, { reminderSentAt: Date.now() });
        }
    }
});