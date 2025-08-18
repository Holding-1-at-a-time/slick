/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as appointments from "../appointments.js";
import type * as checklists from "../checklists.js";
import type * as company from "../company.js";
import type * as customers from "../customers.js";
import type * as dev from "../dev.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as jobs from "../jobs.js";
import type * as management from "../management.js";
import type * as marketing from "../marketing.js";
import type * as pricing from "../pricing.js";
import type * as reports from "../reports.js";
import type * as services from "../services.js";
import type * as users from "../users.js";
import type * as vehicles from "../vehicles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  appointments: typeof appointments;
  checklists: typeof checklists;
  company: typeof company;
  customers: typeof customers;
  dev: typeof dev;
  files: typeof files;
  http: typeof http;
  inventory: typeof inventory;
  jobs: typeof jobs;
  management: typeof management;
  marketing: typeof marketing;
  pricing: typeof pricing;
  reports: typeof reports;
  services: typeof services;
  users: typeof users;
  vehicles: typeof vehicles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
