"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Button } from "@/components/ui";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card className="w-full max-w-[400px]">
      <h1 className="font-heading font-black text-[22px] tracking-[-0.4px] mb-1.5">
        Create account
      </h1>
      <p className="text-muted text-[13px] mb-6">
        Join FormaXI to manage your team and league
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-semibold text-heading mb-2">
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sam Rivera"
            className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-heading mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-heading mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-input border border-white/[0.09] rounded-[10px] px-3.5 py-3 text-primary text-sm font-body outline-none focus:border-accent transition-colors placeholder:text-dim"
          />
        </div>

        <Button variant="primary" size="lg" className="mt-2">
          Create account
        </Button>
      </div>

      <p className="mt-5 pt-5 border-t border-border text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
