"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card, Button } from "@/components/ui";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <Card className="w-full max-w-[400px]">
      <h1 className="font-heading font-black text-[22px] tracking-[-0.4px] mb-1.5">
        Welcome back
      </h1>
      <p className="text-muted text-[13px] mb-6">
        Sign in to your FormaXI account
      </p>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-semibold text-heading mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-semibold text-heading">
              Password
            </label>
            <span className="text-[12px] text-accent font-semibold cursor-pointer hover:underline">
              Forgot password?
            </span>
          </div>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim"
          />
        </div>

        {state?.error && (
          <p className="text-[12.5px] text-loss font-semibold">{state.error}</p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 pt-5 border-t border-border flex flex-col gap-2.5 text-center">
        <p className="text-[13px] text-muted">
          No account?{" "}
          <Link href="/signup" className="text-accent font-semibold hover:underline">
            Create one
          </Link>
        </p>
        <Link
          href="/discover"
          className="text-[12.5px] text-dim hover:text-secondary transition-colors"
        >
          Browse leagues without an account →
        </Link>
      </div>
    </Card>
  );
}
