"use client";

import { useState, useTransition } from "react";
import { upsertPricingRule } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/input";
import { MODIFIER_TYPE_LABELS } from "@/lib/labels";
import type { BuilderPricingRule, BuilderQuestion } from "./types";

export function PricingRuleForm({
  funnelId,
  questions,
  existing,
  onDone,
  onCancel,
}: {
  funnelId: string;
  questions: BuilderQuestion[];
  existing?: BuilderPricingRule;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [questionId, setQuestionId] = useState<string>(existing?.questionId ?? "");
  const [optionValue, setOptionValue] = useState<string>(existing?.optionValue ?? "");
  const [modifierType, setModifierType] = useState<BuilderPricingRule["modifierType"]>(existing?.modifierType ?? "flat");
  const [modifierValue, setModifierValue] = useState<string>(String(existing?.modifierValue ?? ""));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedQuestion = questions.find((q) => q.id === questionId);
  const hasOptions = Boolean(selectedQuestion?.options?.length);

  function submit() {
    setError(null);
    const num = Number(modifierValue);
    if (Number.isNaN(num)) {
      setError("Saisissez une valeur numérique.");
      return;
    }
    if (hasOptions && !optionValue) {
      setError("Choisissez l'option qui déclenche cette règle.");
      return;
    }
    startTransition(async () => {
      try {
        await upsertPricingRule(funnelId, existing?.id ?? null, {
          questionId: questionId || null,
          optionValue: hasOptions ? optionValue : null,
          modifierType,
          modifierValue: num,
          description: description.trim() || null,
        });
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'enregistrement de la règle de tarification.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-brand/40 bg-brand/[0.03] p-4">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Question déclenchante (optionnel — laisser vide pour une règle globale)</Label>
          <Select value={questionId} onChange={(e) => { setQuestionId(e.target.value); setOptionValue(""); }}>
            <option value="">(Globale — s&apos;applique toujours)</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </Select>
        </div>
        {hasOptions && (
          <div>
            <Label>Quand la réponse est</Label>
            <Select value={optionValue} onChange={(e) => setOptionValue(e.target.value)}>
              <option value="">Choisir une option…</option>
              {selectedQuestion!.options!.map((o) => (
                <option key={o.id} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Type de modificateur</Label>
          <Select value={modifierType} onChange={(e) => setModifierType(e.target.value as BuilderPricingRule["modifierType"])}>
            {Object.entries(MODIFIER_TYPE_LABELS).map(([value, l]) => (
              <option key={value} value={value}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{MODIFIER_TYPE_LABELS[modifierType]}</Label>
          <Input type="number" step="0.01" value={modifierValue} onChange={(e) => setModifierValue(e.target.value)} placeholder="ex. 250" />
        </div>
      </div>

      <div className="mt-4">
        <Label>Description (note interne, optionnelle)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex. Supplément toiture métallique" />
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
