import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    role: v.union(v.literal('admin'), v.literal('technician')),
  }).index('by_clerk_id', ['clerkId']),

  company: defineTable({
    name: v.string(),
    logoUrl: v.optional(v.string()),
    defaultLaborRate: v.number(),
    stripeConnectAccountId: v.optional(v.string()),
  }),

  services: defineTable({
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    isPackage: v.boolean(),
    serviceIds: v.array(v.id('services')),
    isDealerPackage: v.boolean(),
    estimatedDurationHours: v.optional(v.number()),
  }).searchIndex('search_name', { searchField: 'name' }),

  pricingMatrices: defineTable({
    name: v.string(),
    appliesToServiceIds: v.array(v.id('services')),
    rules: v.array(v.object({
      id: v.string(),
      factor: v.string(),
      adjustmentType: v.union(v.literal('percentage'), v.literal('fixedAmount')),
      adjustmentValue: v.number(),
    })),
  }),

  upcharges: defineTable({
    name: v.string(),
    description: v.string(),
    defaultAmount: v.number(),
    isPercentage: v.boolean(),
  }),

  checklists: defineTable({
    name: v.string(),
    serviceId: v.id('services'),
    tasks: v.array(v.string()),
  }),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
  }).index('by_email', ['email']),

  vehicles: defineTable({
    customerId: v.id('customers'),
    vin: v.string(),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    color: v.optional(v.string()),
  }).index('by_customer', ['customerId'])
    .searchIndex("search_vin_make_model", { searchField: "vin" }),

  jobs: defineTable({
    customerId: v.id('customers'),
    vehicleId: v.id('vehicles'),
    status: v.union(v.literal('estimate'), v.literal('workOrder'), v.literal('invoice'), v.literal('completed'), v.literal('cancelled')),
    estimateDate: v.number(),
    workOrderDate: v.optional(v.number()),
    invoiceDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    totalAmount: v.number(),
    paymentReceived: v.number(),
    paymentStatus: v.union(v.literal('unpaid'), v.literal('partial'), v.literal('paid')),
    jobItems: v.array(v.object({
        id: v.string(),
        serviceId: v.id('services'),
        quantity: v.number(),
        unitPrice: v.number(),
        appliedPricingRuleIds: v.array(v.string()),
        addedUpchargeIds: v.array(v.id('upcharges')),
        total: v.number(),
        checklistCompletedItems: v.optional(v.array(v.string())),
    })),
    payments: v.optional(v.array(v.object({
        id: v.string(),
        amount: v.number(),
        paymentDate: v.number(),
        method: v.union(v.literal('Cash'), v.literal('Credit Card'), v.literal('Check'), v.literal('Bank Transfer'), v.literal('Other')),
        notes: v.optional(v.string()),
    }))),
    assignedTechnicianIds: v.optional(v.array(v.id('users'))),
    photos: v.optional(v.array(v.object({
        id: v.string(),
        storageId: v.id('_storage'),
        type: v.union(v.literal('before'), v.literal('after')),
        timestamp: v.number(),
    }))),
    customerApprovalStatus: v.optional(v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))),
    customerSignatureStorageId: v.optional(v.id('_storage')),
    approvalTimestamp: v.optional(v.number()),
    appliedPromotionId: v.optional(v.id('promotions')),
    discountAmount: v.optional(v.number()),
    publicLinkKey: v.optional(v.string()),
  }).index('by_customer', ['customerId']).index('by_public_link_key', ['publicLinkKey']),

  appointments: defineTable({
    jobId: v.id('jobs'),
    startTime: v.number(),
    endTime: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal('scheduled'), v.literal('inProgress'), v.literal('completed'), v.literal('cancelled')),
  }).index('by_job', ['jobId']),

  suppliers: defineTable({ name: v.string(), contactEmail: v.optional(v.string()) }),

  products: defineTable({
    name: v.string(),
    category: v.string(),
    supplierId: v.id('suppliers'),
    stockLevel: v.number(),
    reorderPoint: v.number(),
  }),

  promotions: defineTable({
    code: v.string(),
    type: v.union(v.literal('percentage'), v.literal('fixedAmount')),
    value: v.number(),
    isActive: v.boolean(),
  }),

  campaigns: defineTable({
    goal: v.string(),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    createdAt: v.number(),
    status: v.union(v.literal('generating'), v.literal('complete'), v.literal('failed')),
  }),
});