"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { BuilderFunnel } from "./types";
import { Badge } from "@/components/ui/card";
import { FUNNEL_STATUS_LABELS, label } from "@/lib/labels";
import { SettingsPanel } from "./settings-panel";
import { QuestionsPanel } from "./questions-panel";
import { LogicPanel } from "./logic-panel";
import { PricingPanel } from "./pricing-panel";
import { SharePanel } from "./share-panel";
import { PublishBar } from "./publish-bar";

const TABS = ["Paramètres", "Questions", "Logique", "Tarification", "Partager"] as const;
type Tab = (typeof TABS)[number];

export function FunnelBuilder({ funnel }: { funnel: BuilderFunnel }) {
  const [tab, setTab] = useState<Tab>("Questions");

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/funnels" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux tunnels
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{funnel.name}</h1>
          <Badge tone={funnel.status === "published" ? "success" : "default"}>
            {label(FUNNEL_STATUS_LABELS, funnel.status)}
          </Badge>
          {funnel.status === "published" && (
            <Link href={`/q/${funnel.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
              voir en direct <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <PublishBar funnelId={funnel.id} status={funnel.status} questionCount={funnel.questions.length} />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 pb-16">
        {tab === "Paramètres" && <SettingsPanel funnel={funnel} />}
        {tab === "Questions" && <QuestionsPanel funnelId={funnel.id} initialQuestions={funnel.questions} />}
        {tab === "Logique" && (
          <LogicPanel funnelId={funnel.id} questions={funnel.questions} initialRules={funnel.logicRules} />
        )}
        {tab === "Tarification" && (
          <PricingPanel
            funnelId={funnel.id}
            questions={funnel.questions}
            basePrice={funnel.basePrice}
            initialRules={funnel.pricingRules}
          />
        )}
        {tab === "Partager" && <SharePanel funnel={funnel} />}
      </div>
    </div>
  );
}
