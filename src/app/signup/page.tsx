"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: FormState = null;

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold text-foreground">Créez votre compte gratuit</h1>
        <p className="mt-1 text-center text-sm text-muted">Aucune carte bancaire requise.</p>

        <form action={formAction} className="mt-8 space-y-4">
          {state?.error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {state.error}
            </div>
          )}
          <div>
            <Label htmlFor="businessName">Nom de l&apos;entreprise</Label>
            <Input id="businessName" name="businessName" required placeholder="Toiture Dupont" />
            {state?.fieldErrors?.businessName && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.businessName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="name">Votre nom</Label>
            <Input id="name" name="name" required placeholder="Alex Martin" />
            {state?.fieldErrors?.name && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>}
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required placeholder="vous@entreprise.com" />
            {state?.fieldErrors?.email && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required minLength={8} placeholder="8 caractères minimum" />
            {state?.fieldErrors?.password && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Création du compte…" : "Créer le compte"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
