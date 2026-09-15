"use client";

import { useActionState } from "react";
import Link from "next/link";
import { verifyTwoFactorLoginAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: FormState = null;

export default function VerifyTwoFactorPage() {
  const [state, formAction, pending] = useActionState(verifyTwoFactorLoginAction, initialState);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold text-foreground">Vérification en deux étapes</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Saisissez le code à 6 chiffres affiché dans votre application d&apos;authentification.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          {state?.error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {state.error}
            </div>
          )}
          <div>
            <Label htmlFor="code">Code à 6 chiffres</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Vérification…" : "Vérifier"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
