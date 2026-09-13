"use client";

import { useState, useTransition } from "react";
import { upsertLogicRule } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import type { BuilderCondition, BuilderLogicRule, BuilderQuestion } from "./types";

const OPERATORS: { value: BuilderCondition["operator"]; label: string }[] = [
  { value: "equals", label: "est égal à" },
  { value: "not_equals", label: "est différent de" },
  { value: "contains", label: "contient" },
  { value: "greater_than", label: "est supérieur à" },
  { value: "less_than", label: "est inférieur à" },
];

function ValueInput({
  sourceQuestion,
  value,
  onChange,
}: {
  sourceQuestion: BuilderQuestion | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  if (sourceQuestion?.options?.length) {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choisir une valeur…</option>
        {sourceQuestion.options.map((o) => (
          <option key={o.id} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Valeur" />;
}

export function LogicRuleForm({
  funnelId,
  questions,
  existing,
  onDone,
  onCancel,
}: {
  funnelId: string;
  questions: BuilderQuestion[];
  existing?: BuilderLogicRule;
  onDone: () => void;
  onCancel: () => void;
}) {
  const defaultTargetId = existing?.targetQuestionId ?? questions[questions.length - 1]?.id ?? "";
  const [targetQuestionId, setTargetQuestionId] = useState(defaultTargetId);
  const [action, setAction] = useState<"show" | "hide">(existing?.action ?? "show");
  const [logicType, setLogicType] = useState<"all" | "any">(existing?.logicType ?? "all");
  const [conditions, setConditions] = useState<BuilderCondition[]>(
    existing?.conditions ?? [
      { questionId: questions.find((q) => q.id !== defaultTargetId)?.id ?? "", operator: "equals", value: "" },
    ]
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const conditionQuestions = questions.filter((q) => q.id !== targetQuestionId);

  function changeTarget(newTargetId: string) {
    setTargetQuestionId(newTargetId);
    // Any condition that referenced the newly-chosen target question is no
    // longer valid (a question can't depend on its own answer) — repoint it
    // to the first remaining question so the dropdown never shows a value
    // that isn't actually one of its options.
    const fallback = questions.find((q) => q.id !== newTargetId)?.id ?? "";
    setConditions((prev) =>
      prev.map((c) => (c.questionId === newTargetId ? { ...c, questionId: fallback, value: "" } : c))
    );
  }

  function updateCondition(i: number, patch: Partial<BuilderCondition>) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCondition() {
    setConditions((prev) => [...prev, { questionId: conditionQuestions[0]?.id ?? "", operator: "equals", value: "" }]);
  }
  function removeCondition(i: number) {
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    setError(null);
    if (!targetQuestionId) {
      setError("Choisissez la question que cette règle contrôle.");
      return;
    }
    if (conditions.length === 0 || conditions.some((c) => !c.questionId || c.value === "")) {
      setError("Chaque condition doit avoir une question et une valeur.");
      return;
    }
    startTransition(async () => {
      try {
        await upsertLogicRule(funnelId, existing?.id ?? null, { targetQuestionId, action, logicType, conditions });
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'enregistrement de la règle.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-brand/40 bg-brand/[0.03] p-4">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Question à contrôler</Label>
          <Select value={targetQuestionId} onChange={(e) => changeTarget(e.target.value)}>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Action</Label>
          <Select value={action} onChange={(e) => setAction(e.target.value as "show" | "hide")}>
            <option value="show">L&apos;afficher quand…</option>
            <option value="hide">La masquer quand…</option>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <Label className="mb-0">Conditions</Label>
          {conditions.length > 1 && (
            <Select value={logicType} onChange={(e) => setLogicType(e.target.value as "all" | "any")} className="w-48">
              <option value="all">Toutes les conditions (ET)</option>
              <option value="any">Au moins une condition (OU)</option>
            </Select>
          )}
        </div>
        <div className="mt-2 space-y-2">
          {conditions.map((cond, i) => {
            const sourceQuestion = questions.find((q) => q.id === cond.questionId);
            return (
              <div key={i} className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
                <Select value={cond.questionId} onChange={(e) => updateCondition(i, { questionId: e.target.value, value: "" })}>
                  {conditionQuestions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.label}
                    </option>
                  ))}
                </Select>
                <Select value={cond.operator} onChange={(e) => updateCondition(i, { operator: e.target.value as BuilderCondition["operator"] })}>
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </Select>
                <ValueInput sourceQuestion={sourceQuestion} value={String(cond.value ?? "")} onChange={(v) => updateCondition(i, { value: v })} />
                <button type="button" onClick={() => removeCondition(i)} className="p-2 text-muted hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addCondition} className="mt-2 inline-flex items-center gap-1 text-sm text-brand hover:underline">
          <Plus className="h-3.5 w-3.5" /> Ajouter une condition
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending}>
          {isPending ? "Enregistrement…" : existing ? "Enregistrer la règle" : "Ajouter la règle"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
