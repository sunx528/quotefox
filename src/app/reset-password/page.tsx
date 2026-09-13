"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { resetPasswordAction, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: FormState = null;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  if (!token) {
    return (
      <p className="mt-8 text-center text-sm text-red-600">
        Ce lien de réinitialisation ne contient pas de jeton valide. Demandez-en un nouveau depuis la page{" "}
        <Link href="/forgot-password" className="underline">
          mot de passe oublié
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {state.error}
        </div>
      )}
      <div>
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input id="password" name="password" type="password" required minLength={8} placeholder="8 caractères minimum" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </Link>
        <h1 className="mt-6 text-center text-2xl font-semibold text-foreground">Choisissez un nouveau mot de passe</h1>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
