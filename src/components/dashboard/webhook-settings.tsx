"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWebhookUrl, regenerateWebhookSecret, removeWebhook } from "@/lib/actions/webhook";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function WebhookSettings({
  webhookUrl,
  webhookSecret,
  recentDeliveries,
}: {
  webhookUrl: string | null;
  webhookSecret: string | null;
  recentDeliveries: { id: string; success: boolean; statusCode: number | null; error: string | null; createdAt: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="font-medium text-foreground">Webhook</h3>
        <p className="mt-1 text-sm text-muted">
          Envoyez un événement <code>lead.created</code> signé vers votre propre point de terminaison dès qu&apos;un nouveau prospect arrive.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await saveWebhookUrl(formData);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
              }
            });
          }}
          className="mt-4 flex gap-2"
        >
          <Input name="webhookUrl" type="url" defaultValue={webhookUrl ?? ""} placeholder="https://votre-crm.exemple.com/webhook" className="flex-1" />
          <Button type="submit" disabled={isPending}>
            Enregistrer
          </Button>
        </form>

        {webhookSecret && (
          <div className="mt-4 space-y-2 text-sm">
            <div>
              <Label className="mb-1">Clé secrète de signature</Label>
              <code className="block rounded-lg bg-black/[0.04] px-3 py-2 text-xs dark:bg-white/[0.06]">{webhookSecret}</code>
              <p className="mt-1 text-xs text-muted">
                Vérifiez les envois avec HMAC-SHA256 du corps brut de la requête, transmis dans l&apos;en-tête{" "}
                <code>X-Quotefox-Signature</code>.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => startTransition(async () => { await regenerateWebhookSecret(); router.refresh(); })}
              >
                Régénérer la clé secrète
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Supprimer la configuration du webhook ?")) {
                    startTransition(async () => { await removeWebhook(); router.refresh(); });
                  }
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {recentDeliveries.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase text-muted">Envois récents</p>
            <ul className="mt-2 space-y-1 text-xs">
              {recentDeliveries.map((d) => (
                <li key={d.id} className={d.success ? "text-emerald-600" : "text-red-600"}>
                  {new Date(d.createdAt).toLocaleString("fr-FR")} — {d.success ? `Livré (${d.statusCode})` : `Échec : ${d.error}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
