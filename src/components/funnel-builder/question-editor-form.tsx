"use client";

import { useState, useTransition } from "react";
import { nanoid } from "nanoid";
import { addQuestion, updateQuestion } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { QUESTION_TYPE_LABELS } from "@/lib/labels";
import type { BuilderOption, BuilderQuestion } from "./types";
import type { QuestionType } from "@/lib/enums";

const CHOICE_TYPES: QuestionType[] = ["single_choice", "multiple_choice"];

export function QuestionEditorForm({
  funnelId,
  existing,
  onDone,
  onCancel,
}: {
  funnelId: string;
  existing?: BuilderQuestion;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<QuestionType>(existing?.type ?? "single_choice");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [helpText, setHelpText] = useState(existing?.helpText ?? "");
  const [required, setRequired] = useState(existing?.required ?? true);
  const [options, setOptions] = useState<BuilderOption[]>(
    existing?.options ?? [
      { id: nanoid(6), label: "", value: "" },
      { id: nanoid(6), label: "", value: "" },
    ]
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isChoiceType = CHOICE_TYPES.includes(type);

  function updateOption(id: string, patch: Partial<BuilderOption>) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
  function addOption() {
    setOptions((prev) => [...prev, { id: nanoid(6), label: "", value: "" }]);
  }
  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  function submit() {
    setError(null);
    if (!label.trim()) {
      setError("L'intitulé de la question est requis.");
      return;
    }
    const cleanOptions = isChoiceType
      ? options
          .filter((o) => o.label.trim())
          .map((o) => ({ ...o, value: o.value.trim() || o.label.trim().toLowerCase().replace(/\s+/g, "_") }))
      : null;

    if (isChoiceType && (!cleanOptions || cleanOptions.length < 2)) {
      setError("Ajoutez au moins deux options.");
      return;
    }

    startTransition(async () => {
      try {
        const input = { type, label: label.trim(), helpText: helpText.trim() || null, required, options: cleanOptions };
        if (existing) {
          await updateQuestion(funnelId, existing.id, input);
        } else {
          await addQuestion(funnelId, input);
        }
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'enregistrement de la question.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-brand/40 bg-brand/[0.03] p-4">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <Label htmlFor="q-type">Type</Label>
          <Select id="q-type" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {Object.entries(QUESTION_TYPE_LABELS).map(([value, l]) => (
              <option key={value} value={value}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="q-label">Question</Label>
          <Input id="q-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. Quel type de bien est-ce ?" />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="q-help">Texte d&apos;aide (optionnel)</Label>
        <Textarea id="q-help" value={helpText} onChange={(e) => setHelpText(e.target.value)} rows={2} />
      </div>

      {isChoiceType && (
        <div className="mt-4">
          <Label>Options</Label>
          <div className="space-y-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Input
                  placeholder="Libellé (ex. Toit métallique)"
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="+$ prix"
                  type="number"
                  step="0.01"
                  value={opt.priceModifier ?? ""}
                  onChange={(e) =>
                    updateOption(opt.id, { priceModifier: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                  className="w-28"
                />
                <button type="button" onClick={() => removeOption(opt.id)} className="text-muted hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="mt-2 inline-flex items-center gap-1 text-sm text-brand hover:underline">
            <Plus className="h-3.5 w-3.5" /> Ajouter une option
          </button>
          <p className="mt-1 text-xs text-muted">
            Les modificateurs de prix créent automatiquement des règles de tarification. Ajustez-les finement dans l&apos;onglet Tarification.
          </p>
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        Obligatoire
      </label>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending}>
          {isPending ? "Enregistrement…" : existing ? "Enregistrer les modifications" : "Ajouter la question"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
