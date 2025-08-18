
export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isPackage: boolean;
  serviceIds: string[]; // if it's a package, list of contained service IDs
  isDealerPackage: boolean;
  estimatedDurationHours?: number;
}

export interface PricingRule {
  id: string;
  factor: string; // e.g., "Sedan", "Heavy Soiling"
  adjustmentType: 'percentage' | 'fixedAmount';
  adjustmentValue: number;
}

export interface PricingMatrix {
  id: string;
  name: string; // e.g., "Vehicle Size", "Condition"
  appliesToServiceIds: string[];
  rules: PricingRule[];
}

export interface Upcharge {
  id: string;
  name: string;
  description: string;
  defaultAmount: number;
  isPercentage: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  serviceId: string; // which service this checklist applies to
  tasks: string[]; // list of tasks
}

export interface Vehicle {
  id: string;
  customerId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  internalNotes?: string;
}

export interface JobItem {
    id: string;
    serviceId: string;
    quantity: number;
    unitPrice: number; // base price of the service at the time of adding
    appliedPricingRuleIds: string[]; // IDs of rules from PricingMatrix
    addedUpchargeIds: string[]; // IDs of standalone upcharges added
    total: number;
    checklistCompletedItems?: string[];
}

export interface Payment {
    id: string;
    amount: number;
    paymentDate: number; // timestamp
    method: 'Cash' | 'Credit Card' | 'Check' | 'Bank Transfer' | 'Other';
    notes?: string;
}

export interface JobPhoto {
    id: string;
    dataUrl: string;
    type: 'before' | 'after';
    timestamp: number;
}

export interface Job {
    id:string;
    companyId?: string; // Future use
    customerId: string;
    vehicleId: string;
    status: 'estimate' | 'workOrder' | 'invoice' | 'completed' | 'cancelled';
    estimateDate: number; // timestamp
    workOrderDate?: number;
    invoiceDate?: number;
    completionDate?: number;
    notes?: string;
    totalAmount: number;
    paymentReceived: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    jobItems: JobItem[];
    payments?: Payment[];
    assignedTechnicianIds?: string[];
    // New fields for technician workflow
    photos?: JobPhoto[];
    customerApprovalStatus?: 'pending' | 'approved' | 'rejected';
    customerSignatureDataUrl?: string;
    approvalTimestamp?: number;
    // New fields for marketing
    appliedPromotionId?: string;
    discountAmount?: number;
    // New field for customer portal
    publicLinkKey?: string;
}

export interface Appointment {
    id: string;
    jobId: string;
    startTime: number; // timestamp
    endTime: number; // timestamp
    title?: string; // Optional, can be derived from job
    description?: string;
    status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled';
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'technician';
}

export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    defaultLaborRate: number;
    stripeConnectAccountId?: string;
}

export interface Supplier {
    id: string;
    name: string;
    contactEmail?: string;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    supplierId: string;
    stockLevel: number;
    reorderPoint: number;
}

export interface Promotion {
    id: string;
    code: string;
    type: 'percentage' | 'fixedAmount';
    value: number;
    isActive: boolean;
}

export interface Campaign {
    id: string;
    goal: string;
    subject: string;
    body: string;
    createdAt: number;
}

export type Page = 'dashboard' | 'management' | 'schedule' | 'settings' | 'reports' | 'inventory' | 'marketing' | 'stripe-onboarding';