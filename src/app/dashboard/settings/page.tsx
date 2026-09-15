import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS, SUBSCRIPTION_STATUS_LABELS, label } from "@/lib/labels";
import { PLAN_PRICES, type Plan } from "@/lib/enums";
import { UpdateOrgNameForm, UpdateEmailForm, UpdatePasswordForm } from "@/components/dashboard/settings-forms";
import { LogOut } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [org, sub] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.organizationId } }),
    prisma.subscription.findUnique({ where: { organizationId: user.organizationId } }),
  ]);

  const plan = (sub?.plan as Plan) ?? "free";
  const price = PLAN_PRICES[plan];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>
      <p className="mt-1 text-sm text-muted">Gérez votre entreprise, votre connexion et votre forfait.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateOrgNameForm initialName={org?.name ?? ""} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Adresse e-mail</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateEmailForm initialEmail={user.email} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Forfait</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-foreground">
                {label(PLAN_LABELS, plan)}
                {price > 0 && <span className="ml-1.5 text-base font-normal text-muted">— {price} $/mois</span>}
              </p>
              <Badge tone={sub?.status === "past_due" ? "danger" : "success"} className="mt-2">
                {label(SUBSCRIPTION_STATUS_LABELS, sub?.status ?? "active")}
              </Badge>
            </div>
            <Link href="/dashboard/billing">
              <Button variant="secondary">Gérer la facturation</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <form action={logoutAction} className="mt-6">
        <Button type="submit" variant="ghost">
          <LogOut className="h-4 w-4" /> Se déconnecter
        </Button>
      </form>
    </div>
  );
}
