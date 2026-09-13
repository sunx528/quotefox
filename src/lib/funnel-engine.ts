// Deterministic, server-side funnel evaluation: conditional visibility + pricing.
// This file has no framework/DB imports so it can be unit-tested in isolation
// and so the exact same logic runs on the client (for instant UI feedback) and
// is re-run authoritatively on the server before a price or lead is ever persisted.

export type ConditionOperator = "equals" | "not_equals" | "contains" | "greater_than" | "less_than";

export type Condition = {
  questionId: string;
  operator: ConditionOperator;
  value: unknown;
};

export type LogicRule = {
  targetQuestionId: string;
  action: "show" | "hide";
  logicType: "all" | "any";
  conditions: Condition[];
};

export type QuestionOption = {
  id: string;
  label: string;
  value: string;
  priceModifier?: number;
};

export type EngineQuestion = {
  id: string;
  order: number;
  type:
    | "single_choice"
    | "multiple_choice"
    | "text"
    | "number"
    | "date"
    | "location"
    | "email"
    | "phone"
    | "file";
  label: string;
  helpText?: string | null;
  required: boolean;
  options: QuestionOption[] | null;
};

export type PricingRule = {
  questionId: string | null;
  optionValue: string | null;
  modifierType: "flat" | "percent" | "per_unit";
  modifierValue: number;
};

export type AnswerMap = Record<string, unknown>;

function evaluateCondition(condition: Condition, answers: AnswerMap): boolean {
  const answer = answers[condition.questionId];

  switch (condition.operator) {
    case "equals":
      return Array.isArray(answer) ? answer.includes(condition.value) : answer === condition.value;
    case "not_equals":
      return Array.isArray(answer) ? !answer.includes(condition.value) : answer !== condition.value;
    case "contains":
      if (Array.isArray(answer)) return answer.includes(condition.value);
      return typeof answer === "string" && answer.includes(String(condition.value));
    case "greater_than":
      return Number(answer) > Number(condition.value);
    case "less_than":
      return Number(answer) < Number(condition.value);
    default:
      return false;
  }
}

function evaluateRule(rule: LogicRule, answers: AnswerMap): boolean {
  if (rule.conditions.length === 0) return true;
  return rule.logicType === "any"
    ? rule.conditions.some((c) => evaluateCondition(c, answers))
    : rule.conditions.every((c) => evaluateCondition(c, answers));
}

/**
 * Returns the ordered list of questions that should currently be visible given
 * the answers collected so far. A question with no logic rule is always visible.
 * When multiple rules target the same question, the last rule (by array order)
 * wins — funnel editors are expected to keep at most one rule per question.
 */
export function resolveVisibleQuestions(
  questions: EngineQuestion[],
  logicRules: LogicRule[],
  answers: AnswerMap
): EngineQuestion[] {
  const visibility = new Map<string, boolean>();

  for (const rule of logicRules) {
    const matched = evaluateRule(rule, answers);
    const shouldBeVisible = rule.action === "show" ? matched : !matched;
    visibility.set(rule.targetQuestionId, shouldBeVisible);
  }

  return questions
    .filter((q) => visibility.get(q.id) ?? true)
    .sort((a, b) => a.order - b.order);
}

export type ValidationResult = { valid: boolean; errors: Record<string, string> };

/**
 * `fileCounts` carries how many files were attached per "file"-type question —
 * that answer never lives in `answers` (see AnswerMap), so without it a
 * required file question could never validate as filled, on the client or the
 * server, no matter how many files the visitor actually attached.
 */
export function validateAnswers(
  visibleQuestions: EngineQuestion[],
  answers: AnswerMap,
  fileCounts: Record<string, number> = {}
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const q of visibleQuestions) {
    if (q.type === "file") {
      if (q.required && (fileCounts[q.id] ?? 0) === 0) {
        errors[q.id] = "Ce champ est obligatoire.";
      }
      continue;
    }

    const value = answers[q.id];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (q.required && isEmpty) {
      errors[q.id] = "Ce champ est obligatoire.";
      continue;
    }
    if (isEmpty) continue;

    if (q.type === "email" && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[q.id] = "Saisissez une adresse e-mail valide.";
    }
    if (q.type === "number" && Number.isNaN(Number(value))) {
      errors[q.id] = "Saisissez un nombre valide.";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export type PriceEstimate = { base: number; total: number; low: number; high: number };

/**
 * Deterministic pricing: start from the funnel base price, then apply each
 * matching rule in order. "flat" adds a fixed amount, "percent" scales the
 * running total, "per_unit" multiplies the rule's rate by the numeric answer
 * to its question. The final low/high range is +/-15% around the computed
 * total, which is disclosed to the visitor as an estimate, not a firm quote.
 */
export function computePriceEstimate(
  basePrice: number,
  pricingRules: PricingRule[],
  answers: AnswerMap
): PriceEstimate {
  let total = basePrice;

  for (const rule of pricingRules) {
    if (rule.questionId === null) {
      if (rule.modifierType === "flat") total += rule.modifierValue;
      if (rule.modifierType === "percent") total *= 1 + rule.modifierValue / 100;
      continue;
    }

    const answer = answers[rule.questionId];
    if (answer === undefined || answer === null || answer === "") continue;

    const selectedValues = Array.isArray(answer) ? answer.map(String) : [String(answer)];
    const matchesOption = rule.optionValue === null || selectedValues.includes(rule.optionValue);
    if (!matchesOption) continue;

    if (rule.modifierType === "flat") {
      total += rule.modifierValue;
    } else if (rule.modifierType === "percent") {
      total *= 1 + rule.modifierValue / 100;
    } else if (rule.modifierType === "per_unit") {
      const quantity = Number(answer);
      if (!Number.isNaN(quantity)) total += rule.modifierValue * quantity;
    }
  }

  total = Math.max(0, Math.round(total * 100) / 100);
  const low = Math.round(total * 0.85 * 100) / 100;
  const high = Math.round(total * 1.15 * 100) / 100;

  return { base: basePrice, total, low, high };
}
