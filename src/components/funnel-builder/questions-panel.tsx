"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion, reorderQuestions } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { QuestionEditorForm } from "./question-editor-form";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";
import { QUESTION_TYPE_LABELS, label } from "@/lib/labels";
import type { BuilderQuestion } from "./types";

export function QuestionsPanel({ funnelId, initialQuestions }: { funnelId: string; initialQuestions: BuilderQuestion[] }) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const questions = [...initialQuestions].sort((a, b) => a.order - b.order);

  function refresh() {
    setAddingNew(false);
    setEditingId(null);
    router.refresh();
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const reordered = [...questions];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    startTransition(async () => {
      await reorderQuestions(funnelId, reordered.map((q) => q.id));
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette question ? Toute règle de logique ou de tarification qui y fait référence sera également supprimée.")) return;
    startTransition(async () => {
      await deleteQuestion(funnelId, id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {questions.length === 0 && !addingNew && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">Aucune question pour l&apos;instant. Ajoutez la première ci-dessous.</CardContent>
        </Card>
      )}

      {questions.map((q, i) =>
        editingId === q.id ? (
          <QuestionEditorForm key={q.id} funnelId={funnelId} existing={q} onDone={refresh} onCancel={() => setEditingId(null)} />
        ) : (
          <Card key={q.id}>
            <CardContent className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{q.label}</span>
                  {q.required && <Badge tone="brand">Obligatoire</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {label(QUESTION_TYPE_LABELS, q.type)}
                  {q.options ? ` · ${q.options.length} options` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button disabled={isPending || i === 0} onClick={() => move(i, -1)} className="p-1.5 text-muted hover:text-foreground disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  disabled={isPending || i === questions.length - 1}
                  onClick={() => move(i, 1)}
                  className="p-1.5 text-muted hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(q.id)} className="p-1.5 text-muted hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(q.id)} className="p-1.5 text-muted hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {addingNew ? (
        <QuestionEditorForm funnelId={funnelId} onDone={refresh} onCancel={() => setAddingNew(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setAddingNew(true)}>
          <Plus className="h-4 w-4" /> Ajouter une question
        </Button>
      )}
    </div>
  );
}
