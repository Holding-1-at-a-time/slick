import { Doc, Id } from "./convex/_generated/dataModel";

export type Service = Doc<"services">;
export type PricingRule = Doc<"pricingMatrices">["rules"][number];
export type PricingMatrix = Doc<"pricingMatrices">;
export type Upcharge = Doc<"upcharges">;
export type Checklist = Doc<"checklists">;
export type Vehicle = Doc<"vehicles">;
export type Customer = Doc<"customers">;
export type JobItem = Doc<"jobs">["jobItems"][number];
export type Payment = Doc<"jobs">["payments"][number];
export type JobPhoto = Doc<"jobs">["photos"][number];
export type Job = Doc<"jobs">;
export type Appointment = Doc<"appointments">;
export type User = Doc<"users">;
export type Company = Doc<"company">;
export type Supplier = Doc<"suppliers">;
export type Product = Doc<"products">;
export type Promotion = Doc<"promotions">;
export type Campaign = Doc<"campaigns">;

export type Page = 'dashboard' | 'management' | 'schedule' | 'settings' | 'reports' | 'inventory' | 'marketing' | 'stripe-onboarding';
