"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: FormState = null;

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);
  const submitted = state !== null && !state.error;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold text-foreground">Réinitialisez votre mot de passe</h1>

        {submitted ? (
          <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Si un compte existe pour cette adresse e-mail, nous avons envoyé un lien de réinitialisation. Il expire dans 1 heure.
          </div>
        ) : (
          <form action={formAction} className="mt-8 space-y-4">
            {state?.error && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {state.error}
              </div>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="vous@entreprise.com" />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
