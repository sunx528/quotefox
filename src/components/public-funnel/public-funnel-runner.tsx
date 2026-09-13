"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  resolveVisibleQuestions,
  validateAnswers,
  computePriceEstimate,
  type EngineQuestion,
  type LogicRule,
  type PricingRule,
} from "@/lib/funnel-engine";
import { QuestionField } from "./question-field";

type FunnelPayload = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  subheadline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  basePrice: number;
  questions: EngineQuestion[];
  logicRules: LogicRule[];
  pricingRules: PricingRule[];
  organization: { name: string };
};

type Stage = "intro" | "questions" | "review" | "submitting" | "success" | "error";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "qf_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

async function trackEvent(slug: string, type: string, sessionId: string, metadata?: Record<string, unknown>) {
  try {
    await fetch(`/api/funnels/${slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, sessionId, metadata }),
      keepalive: true,
    });
  } catch {
    // Analytics failures should never block the visitor's experience.
  }
}

export function PublicFunnelRunner({ funnel }: { funnel: FunnelPayload }) {
  const sessionId = useRef(getSessionId());
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ estimateLow: number; estimateHigh: number } | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    trackEvent(funnel.slug, "view", sessionId.current);
  }, [funnel.slug]);

  const visibleQuestions = useMemo(
    () => resolveVisibleQuestions(funnel.questions, funnel.logicRules, answers),
    [funnel.questions, funnel.logicRules, answers]
  );

  const currentQuestion = visibleQuestions[currentIndex];
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;
  const estimate = useMemo(
    () => computePriceEstimate(funnel.basePrice, funnel.pricingRules, answers),
    [funnel.basePrice, funnel.pricingRules, answers]
  );

  function beginFunnel() {
    setStage("questions");
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent(funnel.slug, "start", sessionId.current);
    }
  }

  function goNext() {
    if (!currentQuestion) return;
    const fileCounts = { [currentQuestion.id]: files[currentQuestion.id]?.length ?? 0 };
    const validation = validateAnswers([currentQuestion], answers, fileCounts);
    if (!validation.valid) {
      setStepError(Object.values(validation.errors)[0]);
      return;
    }
    setStepError(null);
    trackEvent(funnel.slug, "question_progress", sessionId.current, { questionIndex: currentIndex });

    if (isLastQuestion) {
      trackEvent(funnel.slug, "completion", sessionId.current);
      setStage("review");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function goBack() {
    setStepError(null);
    if (currentIndex === 0) {
      setStage("intro");
    } else {
      setCurrentIndex((i) => i - 1);
    }
  }

  async function submit() {
    setStage("submitting");
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.set("sessionId", sessionId.current);
      formData.set("answers", JSON.stringify(answers));
      for (const q of visibleQuestions) {
        if (q.type === "file" && files[q.id]) {
          for (const file of files[q.id]) formData.append(`file_${q.id}`, file);
        }
      }

      const res = await fetch(`/api/funnels/${funnel.slug}/submit`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Une erreur est survenue. Veuillez réessayer.");
        setStage("review");
        return;
      }

      setResult({ estimateLow: data.estimateLow, estimateHigh: data.estimateHigh });
      setStage("success");
    } catch {
      setSubmitError("Erreur réseau — vérifiez votre connexion et réessayez.");
      setStage("review");
    }
  }

  const progressPct = visibleQuestions.length ? ((currentIndex + 1) / visibleQuestions.length) * 100 : 0;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8"
      style={{ "--brand": funnel.primaryColor } as React.CSSProperties}
    >
      <div className="w-full max-w-lg">
        {funnel.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={funnel.logoUrl} alt={funnel.organization.name} className="mx-auto mb-6 h-10 object-contain" />
        )}

        {stage === "intro" && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-foreground">{funnel.headline}</h1>
            {funnel.subheadline && <p className="mt-2 text-muted">{funnel.subheadline}</p>}
            <button
              onClick={beginFunnel}
              className="mt-6 w-full rounded-xl bg-brand px-6 py-3 font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Obtenir mon estimation instantanée
            </button>
            <p className="mt-3 text-xs text-muted">Environ une minute. Sans engagement.</p>
          </div>
        )}

        {stage === "questions" && currentQuestion && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Question {currentIndex + 1} sur {visibleQuestions.length}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{currentQuestion.label}</h2>
            {currentQuestion.helpText && <p className="mt-1 text-sm text-muted">{currentQuestion.helpText}</p>}

            <div className="mt-5">
              <QuestionField
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }))}
                files={files[currentQuestion.id]}
                onFilesChange={(fs) => setFiles((prev) => ({ ...prev, [currentQuestion.id]: fs }))}
              />
            </div>

            {stepError && <p className="mt-3 text-sm text-red-600">{stepError}</p>}

            <div className="mt-6 flex items-center justify-between">
              <button onClick={goBack} className="text-sm font-medium text-muted hover:text-foreground">
                Retour
              </button>
              <button onClick={goNext} className="rounded-xl bg-brand px-6 py-2.5 font-medium text-brand-foreground hover:opacity-90">
                {isLastQuestion ? "Voir mon estimation" : "Suivant"}
              </button>
            </div>
          </div>
        )}

        {(stage === "review" || stage === "submitting") && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-muted">Votre fourchette de prix estimée</p>
            <p className="mt-2 text-4xl font-semibold text-foreground">
              {estimate.low.toLocaleString()} $ – {estimate.high.toLocaleString()} $
            </p>
            <p className="mt-2 text-sm text-muted">Tarif final confirmé par {funnel.organization.name} après examen.</p>
            {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}
            <button
              onClick={submit}
              disabled={stage === "submitting"}
              className="mt-6 w-full rounded-xl bg-brand px-6 py-3 font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
            >
              {stage === "submitting" ? "Envoi…" : "Demander cette estimation"}
            </button>
            <button onClick={() => setStage("questions")} className="mt-3 text-sm text-muted hover:text-foreground">
              Modifier mes réponses
            </button>
          </div>
        )}

        {stage === "success" && result && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Demande envoyée !</h2>
            <p className="mt-2 text-muted">
              Votre fourchette estimée est de{" "}
              <strong className="text-foreground">
                {result.estimateLow.toLocaleString()} $ – {result.estimateHigh.toLocaleString()} $
              </strong>
              . {funnel.organization.name} vous contactera prochainement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
