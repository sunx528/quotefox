"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: FormState = null;

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold text-foreground">Se connecter</h1>

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
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="mb-1.5">Mot de passe</Label>
              <Link href="/forgot-password" className="mb-1.5 text-xs text-muted hover:text-foreground">
                Mot de passe oublié ?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Vous n&apos;avez pas de compte ?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Essai gratuit
          </Link>
        </p>
      </div>
    </div>
  );
}
