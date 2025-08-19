import { Doc, Id } from "./convex/_generated/dataModel";

export type Service = Doc<"services"> & {
  productsUsed?: { productId: Id<'products'>, quantity: number }[];
};
export type PricingRule = Doc<"pricingMatrices">["rules"][number];
export type PricingMatrix = Doc<"pricingMatrices">;
export type Upcharge = Doc<"upcharges">;
export type Checklist = Doc<"checklists">;
export type Vehicle = Doc<"vehicles">;
export type Customer = Doc<"customers">;
export type JobItem = Doc<"jobs">["jobItems"][number];
export type Payment = Doc<"jobs">["payments"][number];
export type JobPhoto = Doc<"jobs">["photos"][number];
export type Job = Doc<"jobs"> & {
    inventoryDebited?: boolean;
};
export type Appointment = Doc<"appointments">;
export type User = Doc<"users">;
export type Company = Doc<"company"> & {
    enableAutomaticInventory?: boolean;
};
export type Supplier = Doc<"suppliers">;
export type Product = Doc<"products"> & {
    lastCostPerUnit?: number;
};
export type Promotion = Doc<"promotions">;
export type Campaign = Doc<"campaigns">;
export type InventoryLog = Doc<"inventoryLog">;

export type Page = 'dashboard' | 'management' | 'schedule' | 'settings' | 'reports' | 'inventory' | 'marketing' | 'stripe-onboarding' | 'knowledge-base';