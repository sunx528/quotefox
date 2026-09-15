"use client";

import { useActionState } from "react";
import {
  updateOrganizationNameAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/lib/actions/account";
import type { FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: FormState = null;

function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {state.error}
      </div>
    );
  }
  if (state !== null) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        Modifications enregistrées.
      </div>
    );
  }
  return null;
}

export function UpdateOrgNameForm({ initialName }: { initialName: string }) {
  const [state, formAction, pending] = useActionState(updateOrganizationNameAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="org-name">Nom de l&apos;entreprise</Label>
        <Input id="org-name" name="name" defaultValue={initialName} required maxLength={120} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

export function UpdateEmailForm({ initialEmail }: { initialEmail: string }) {
  const [state, formAction, pending] = useActionState(updateEmailAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={initialEmail} required />
      </div>
      <div>
        <Label htmlFor="email-current-password">Mot de passe actuel</Label>
        <Input id="email-current-password" name="currentPassword" type="password" required placeholder="Pour confirmer le changement" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Enregistrement…" : "Mettre à jour l'e-mail"}
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="current-password">Mot de passe actuel</Label>
        <Input id="current-password" name="currentPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <Input id="new-password" name="newPassword" type="password" required minLength={8} placeholder="8 caractères minimum" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
