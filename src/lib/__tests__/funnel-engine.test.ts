import { describe, it, expect } from "vitest";
import {
  resolveVisibleQuestions,
  validateAnswers,
  computePriceEstimate,
  type EngineQuestion,
  type LogicRule,
  type PricingRule,
} from "../funnel-engine";

const q = (over: Partial<EngineQuestion> & { id: string; order: number }): EngineQuestion => ({
  type: "text",
  label: "Q",
  required: true,
  options: null,
  ...over,
});

describe("resolveVisibleQuestions", () => {
  it("shows all questions when there are no logic rules", () => {
    const questions = [q({ id: "a", order: 0 }), q({ id: "b", order: 1 })];
    expect(resolveVisibleQuestions(questions, [], {})).toHaveLength(2);
  });

  it("hides a target question until its show-condition matches", () => {
    const questions = [
      q({ id: "property_type", order: 0, type: "single_choice" }),
      q({ id: "floors", order: 1 }),
    ];
    const rules: LogicRule[] = [
      {
        targetQuestionId: "floors",
        action: "show",
        logicType: "all",
        conditions: [{ questionId: "property_type", operator: "equals", value: "house" }],
      },
    ];

    expect(resolveVisibleQuestions(questions, rules, {}).map((x) => x.id)).toEqual(["property_type"]);
    expect(
      resolveVisibleQuestions(questions, rules, { property_type: "apartment" }).map((x) => x.id)
    ).toEqual(["property_type"]);
    expect(
      resolveVisibleQuestions(questions, rules, { property_type: "house" }).map((x) => x.id)
    ).toEqual(["property_type", "floors"]);
  });

  it("supports combined AND conditions", () => {
    const questions = [q({ id: "target", order: 0 })];
    const rules: LogicRule[] = [
      {
        targetQuestionId: "target",
        action: "show",
        logicType: "all",
        conditions: [
          { questionId: "property_type", operator: "equals", value: "house" },
          { questionId: "roof_type", operator: "equals", value: "flat" },
        ],
      },
    ];

    expect(
      resolveVisibleQuestions(questions, rules, { property_type: "house", roof_type: "pitched" })
    ).toHaveLength(0);
    expect(
      resolveVisibleQuestions(questions, rules, { property_type: "house", roof_type: "flat" })
    ).toHaveLength(1);
  });

  it("handles a rule referencing a deleted question by simply never matching it", () => {
    const questions = [q({ id: "target", order: 0 })];
    const rules: LogicRule[] = [
      {
        targetQuestionId: "target",
        action: "show",
        logicType: "all",
        conditions: [{ questionId: "deleted_question", operator: "equals", value: "x" }],
      },
    ];
    expect(resolveVisibleQuestions(questions, rules, {})).toHaveLength(0);
  });
});

describe("validateAnswers", () => {
  it("flags missing required answers", () => {
    const questions = [q({ id: "a", order: 0, required: true })];
    const result = validateAnswers(questions, {});
    expect(result.valid).toBe(false);
    expect(result.errors.a).toBeTruthy();
  });

  it("allows missing optional answers", () => {
    const questions = [q({ id: "a", order: 0, required: false })];
    const result = validateAnswers(questions, {});
    expect(result.valid).toBe(true);
  });

  it("rejects invalid email format", () => {
    const questions = [q({ id: "email", order: 0, type: "email", required: true })];
    const result = validateAnswers(questions, { email: "not-an-email" });
    expect(result.valid).toBe(false);
  });

  it("flags a required file question with zero files attached", () => {
    const questions = [q({ id: "photo", order: 0, type: "file", required: true })];
    // Regression test: a "file" question's answer never lives in `answers`
    // (files are tracked separately), so without the fileCounts parameter this
    // question could never be satisfied even with a real file attached.
    const result = validateAnswers(questions, {}, { photo: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.photo).toBeTruthy();
  });

  it("accepts a required file question once at least one file is attached", () => {
    const questions = [q({ id: "photo", order: 0, type: "file", required: true })];
    const result = validateAnswers(questions, {}, { photo: 2 });
    expect(result.valid).toBe(true);
  });

  it("allows an optional file question with no files attached", () => {
    const questions = [q({ id: "photo", order: 0, type: "file", required: false })];
    const result = validateAnswers(questions, {}, { photo: 0 });
    expect(result.valid).toBe(true);
  });

  it("accepts a valid email", () => {
    const questions = [q({ id: "email", order: 0, type: "email", required: true })];
    const result = validateAnswers(questions, { email: "a@b.com" });
    expect(result.valid).toBe(true);
  });
});

describe("computePriceEstimate", () => {
  it("returns the base price with no matching rules", () => {
    const estimate = computePriceEstimate(100, [], {});
    expect(estimate.total).toBe(100);
    expect(estimate.low).toBeLessThan(estimate.total);
    expect(estimate.high).toBeGreaterThan(estimate.total);
  });

  it("applies a flat modifier only when the option is selected", () => {
    const rules: PricingRule[] = [
      { questionId: "material", optionValue: "metal", modifierType: "flat", modifierValue: 500 },
    ];
    expect(computePriceEstimate(1000, rules, { material: "shingle" }).total).toBe(1000);
    expect(computePriceEstimate(1000, rules, { material: "metal" }).total).toBe(1500);
  });

  it("applies a percent modifier multiplicatively", () => {
    const rules: PricingRule[] = [
      { questionId: "urgency", optionValue: "rush", modifierType: "percent", modifierValue: 20 },
    ];
    expect(computePriceEstimate(1000, rules, { urgency: "rush" }).total).toBe(1200);
  });

  it("applies a per_unit modifier scaled by the numeric answer", () => {
    const rules: PricingRule[] = [
      { questionId: "sq_ft", optionValue: null, modifierType: "per_unit", modifierValue: 3 },
    ];
    expect(computePriceEstimate(0, rules, { sq_ft: 200 }).total).toBe(600);
  });

  it("never goes negative even with large negative modifiers", () => {
    const rules: PricingRule[] = [
      { questionId: "discount", optionValue: "vip", modifierType: "flat", modifierValue: -10000 },
    ];
    expect(computePriceEstimate(100, rules, { discount: "vip" }).total).toBe(0);
  });

  it("ignores rules for unanswered questions", () => {
    const rules: PricingRule[] = [
      { questionId: "material", optionValue: "metal", modifierType: "flat", modifierValue: 500 },
    ];
    expect(computePriceEstimate(1000, rules, {}).total).toBe(1000);
  });
});
