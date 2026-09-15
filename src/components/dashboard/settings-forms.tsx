"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateOrganizationNameAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/lib/actions/account";
import { startTwoFactorSetup, confirmTwoFactorSetup, disableTwoFactor } from "@/lib/actions/two-factor";
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
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

export function TwoFactorSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setSetupError(null);
    startTransition(async () => {
      const result = await startTwoFactorSetup();
      if ("error" in result) setSetupError(result.error);
      else setSetup(result);
    });
  }

  function handleConfirm() {
    setSetupError(null);
    startTransition(async () => {
      const result = await confirmTwoFactorSetup(code);
      if (result.error) {
        setSetupError(result.error);
      } else {
        setEnabled(true);
        setSetup(null);
        setCode("");
      }
    });
  }

  function handleDisable() {
    setDisableError(null);
    startTransition(async () => {
      const result = await disableTwoFactor(disablePassword);
      if (result.error) {
        setDisableError(result.error);
      } else {
        setEnabled(false);
        setDisablePassword("");
      }
    });
  }

  if (enabled) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Activée — un code de votre application d&apos;authentification sera demandé à chaque connexion.
        </p>
        <div>
          <Label htmlFor="disable-2fa-password">Mot de passe actuel</Label>
          <Input
            id="disable-2fa-password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Pour confirmer la désactivation"
          />
        </div>
        {disableError && <ErrorBanner message={disableError} />}
        <Button variant="danger" onClick={handleDisable} disabled={isPending || !disablePassword}>
          {isPending ? "Désactivation…" : "Désactiver la 2FA"}
        </Button>
      </div>
    );
  }

  if (setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Scannez ce code avec Google Authenticator (ou une application compatible), puis saisissez le code à 6
          chiffres généré pour confirmer.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- data: URL QR code, next/image can't optimize it */}
        <img
          src={setup.qrCodeDataUrl}
          alt="Code QR d'authentification à deux facteurs"
          className="h-40 w-40 rounded-lg border border-border bg-white p-2"
        />
        <p className="text-xs text-muted">
          Clé manuelle :{" "}
          <code className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono dark:bg-white/[0.08]">{setup.secret}</code>
        </p>
        <div>
          <Label htmlFor="confirm-2fa-code">Code à 6 chiffres</Label>
          <Input
            id="confirm-2fa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>
        {setupError && <ErrorBanner message={setupError} />}
        <div className="flex gap-2">
          <Button onClick={handleConfirm} disabled={isPending || code.length !== 6}>
            {isPending ? "Vérification…" : "Confirmer et activer"}
          </Button>
          <Button variant="ghost" onClick={() => setSetup(null)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Ajoutez une étape de vérification par code à chaque connexion, via une application comme Google
        Authenticator, Authy ou 1Password.
      </p>
      {setupError && <ErrorBanner message={setupError} />}
      <Button variant="secondary" onClick={handleStart} disabled={isPending}>
        {isPending ? "Génération…" : "Activer l'authentification à deux facteurs"}
      </Button>
    </div>
  );
}
