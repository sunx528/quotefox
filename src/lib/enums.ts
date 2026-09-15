// SQLite has no native enum type, so these are stored as validated strings.
// Every value written to the database must pass through one of these Zod enums.
import { z } from "zod";

export const questionTypeSchema = z.enum([
  "single_choice",
  "multiple_choice",
  "text",
  "number",
  "date",
  "location",
  "email",
  "phone",
  "file",
]);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const funnelStatusSchema = z.enum(["draft", "published"]);
export type FunnelStatus = z.infer<typeof funnelStatusSchema>;

export const leadStatusSchema = z.enum(["new", "contacted", "qualified", "won", "lost"]);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const logicActionSchema = z.enum(["show", "hide"]);
export const logicTypeSchema = z.enum(["all", "any"]);
export const conditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "greater_than",
  "less_than",
]);

export const pricingModifierTypeSchema = z.enum(["flat", "percent", "per_unit"]);

export const planSchema = z.enum(["free", "pro", "business"]);
export type Plan = z.infer<typeof planSchema>;

export const subscriptionStatusSchema = z.enum([
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const analyticsEventTypeSchema = z.enum([
  "view",
  "start",
  "question_progress",
  "completion",
  "lead",
]);
export type AnalyticsEventType = z.infer<typeof analyticsEventTypeSchema>;

export const PLAN_LIMITS: Record<Plan, { funnels: number; leadsPerMonth: number; branding: boolean; webhooks: boolean }> = {
  free: { funnels: 1, leadsPerMonth: 25, branding: true, webhooks: false },
  pro: { funnels: 5, leadsPerMonth: 500, branding: false, webhooks: false },
  business: { funnels: Infinity, leadsPerMonth: 3000, branding: false, webhooks: true },
};

/** Monthly price in USD, shown next to the plan name in Billing and Settings. */
export const PLAN_PRICES: Record<Plan, number> = {
  free: 0,
  pro: 79,
  business: 199,
};
