import type { QuestionType } from "@/lib/enums";

export type BuilderOption = { id: string; label: string; value: string; priceModifier?: number };

export type BuilderQuestion = {
  id: string;
  order: number;
  type: QuestionType;
  label: string;
  helpText: string | null;
  required: boolean;
  options: BuilderOption[] | null;
};

export type BuilderCondition = {
  questionId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: unknown;
};

export type BuilderLogicRule = {
  id: string;
  targetQuestionId: string;
  action: "show" | "hide";
  logicType: "all" | "any";
  conditions: BuilderCondition[];
};

export type BuilderPricingRule = {
  id: string;
  questionId: string | null;
  optionValue: string | null;
  modifierType: "flat" | "percent" | "per_unit";
  modifierValue: number;
  description: string | null;
};

export type BuilderFunnel = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  headline: string;
  subheadline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  basePrice: number;
  questions: BuilderQuestion[];
  logicRules: BuilderLogicRule[];
  pricingRules: BuilderPricingRule[];
};
