"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePricingRule } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { PricingRuleForm } from "./pricing-rule-form";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { BuilderPricingRule, BuilderQuestion } from "./types";

function describeModifier(rule: BuilderPricingRule) {
  if (rule.modifierType === "flat") return `${rule.modifierValue >= 0 ? "+" : ""}${rule.modifierValue} $`;
  if (rule.modifierType === "percent") return `${rule.modifierValue >= 0 ? "+" : ""}${rule.modifierValue} %`;
  return `${rule.modifierValue} $ par unité`;
}

export function PricingPanel({
  funnelId,
  questions,
  basePrice,
  initialRules,
}: {
  funnelId: string;
  questions: BuilderQuestion[];
  basePrice: number;
  initialRules: BuilderPricingRule[];
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    setAddingNew(false);
    setEditingId(null);
    router.refresh();
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette règle de tarification ?")) return;
    startTransition(async () => {
      await deletePricingRule(funnelId, id);
      router.refresh();
    });
  }

  function questionLabel(id: string | null) {
    if (!id) return "Globale";
    return questions.find((q) => q.id === id)?.label ?? "(question supprimée)";
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="py-3 text-sm text-muted">
          Prix de base : <span className="font-medium text-foreground">{basePrice} $</span> — défini dans l&apos;onglet Paramètres.
        </CardContent>
      </Card>

      {initialRules.length === 0 && !addingNew && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            Aucune règle de tarification pour l&apos;instant — l&apos;estimation correspondra simplement au prix de base.
          </CardContent>
        </Card>
      )}

      {initialRules.map((rule) =>
        editingId === rule.id ? (
          <PricingRuleForm key={rule.id} funnelId={funnelId} questions={questions} existing={rule} onDone={refresh} onCancel={() => setEditingId(null)} />
        ) : (
          <Card key={rule.id}>
            <CardContent className="flex items-start justify-between gap-3 py-3">
              <div className="text-sm">
                <Badge tone="brand">{describeModifier(rule)}</Badge>
                <p className="mt-1 text-foreground">
                  {questionLabel(rule.questionId)}
                  {rule.optionValue ? ` = ${rule.optionValue}` : ""}
                </p>
                {rule.description && <p className="text-xs text-muted">{rule.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setEditingId(rule.id)} className="p-1.5 text-muted hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(rule.id)} className="p-1.5 text-muted hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {addingNew ? (
        <PricingRuleForm funnelId={funnelId} questions={questions} onDone={refresh} onCancel={() => setAddingNew(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setAddingNew(true)}>
          <Plus className="h-4 w-4" /> Ajouter une règle de tarification
        </Button>
      )}
    </div>
  );
}
