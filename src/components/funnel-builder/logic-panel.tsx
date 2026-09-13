"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLogicRule } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { LogicRuleForm } from "./logic-rule-form";
import { Pencil, Trash2, Plus } from "lucide-react";
import { LOGIC_ACTION_LABELS, CONDITION_OPERATOR_LABELS, label as translate } from "@/lib/labels";
import type { BuilderLogicRule, BuilderQuestion } from "./types";

export function LogicPanel({
  funnelId,
  questions,
  initialRules,
}: {
  funnelId: string;
  questions: BuilderQuestion[];
  initialRules: BuilderLogicRule[];
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
    if (!confirm("Supprimer cette règle de logique ?")) return;
    startTransition(async () => {
      await deleteLogicRule(funnelId, id);
      router.refresh();
    });
  }

  function questionLabel(id: string) {
    return questions.find((q) => q.id === id)?.label ?? "(question supprimée)";
  }

  if (questions.length < 2) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted">
          Ajoutez au moins deux questions avant de configurer la logique conditionnelle.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {initialRules.length === 0 && !addingNew && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            Aucune règle de logique pour l&apos;instant. Chaque question s&apos;affiche par défaut — ajoutez une règle
            pour en masquer une jusqu&apos;à ce que des réponses précédentes correspondent.
          </CardContent>
        </Card>
      )}

      {initialRules.map((rule) =>
        editingId === rule.id ? (
          <LogicRuleForm key={rule.id} funnelId={funnelId} questions={questions} existing={rule} onDone={refresh} onCancel={() => setEditingId(null)} />
        ) : (
          <Card key={rule.id}>
            <CardContent className="flex items-start justify-between gap-3 py-3">
              <div className="text-sm">
                <Badge tone={rule.action === "show" ? "success" : "warning"} className="mr-2">
                  {translate(LOGIC_ACTION_LABELS, rule.action)}
                </Badge>
                <span className="font-medium text-foreground">{questionLabel(rule.targetQuestionId)}</span>
                <p className="mt-1 text-xs text-muted">
                  quand {rule.conditions.length > 1 ? `(${rule.logicType === "all" ? "toutes les conditions" : "au moins une condition"})` : ""}{" "}
                  {rule.conditions.map((c, i) => (
                    <span key={i}>
                      {i > 0 && ` ${rule.logicType === "all" ? "ET" : "OU"} `}
                      &laquo;&nbsp;{questionLabel(c.questionId)}&nbsp;&raquo; {translate(CONDITION_OPERATOR_LABELS, c.operator)} &laquo;&nbsp;{String(c.value)}&nbsp;&raquo;
                    </span>
                  ))}
                </p>
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
        <LogicRuleForm funnelId={funnelId} questions={questions} onDone={refresh} onCancel={() => setAddingNew(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setAddingNew(true)}>
          <Plus className="h-4 w-4" /> Ajouter une règle de logique
        </Button>
      )}
    </div>
  );
}
