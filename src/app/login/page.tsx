"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(() => searchParams.get("error"));

  const nextPath = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Authentication is still loading. Try again in a moment.");
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.assign(nextPath);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        window.location.assign("/onboarding");
        return;
      }

      setMessage("Account created. If email confirmation is enabled, check your inbox before signing in.");
      setMode("signin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginShell>
      <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setMode("signin")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "signin" ? "bg-[#BF5700] text-white" : "text-white/45 hover:text-white/75"}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "signup" ? "bg-[#BF5700] text-white" : "text-white/45 hover:text-white/75"}`}
        >
          Create Account
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-sm text-white/45">
          {mode === "signin"
            ? "Use your email and password to continue."
            : "Create a quick demo account with email and password."}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleEmailAuth}>
        {mode === "signup" && (
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">Full Name</span>
            <div className="mt-1.5 relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#BF5700]/50"
                placeholder="Alex Rivera"
              />
            </div>
          </label>
        )}

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">Email</span>
          <div className="mt-1.5 relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#BF5700]/50"
              placeholder="alexj@utexas.edu"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">Password</span>
          <div className="mt-1.5 relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#BF5700]/50"
              placeholder="At least 6 characters"
            />
          </div>
        </label>

        {message && (
          <div className="rounded-xl border border-[#BF5700]/20 bg-[#BF5700]/10 px-4 py-3 text-sm text-white/75">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !supabase}
          className="w-full rounded-xl bg-[#BF5700] px-4 py-3 text-sm font-semibold text-white hover:bg-[#A84D00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-xs text-white/30 leading-relaxed">
        Demo scope uses basic email/password auth. Account recovery and verification UX are intentionally minimal in this pass.
      </p>
    </LoginShell>
  );
}

function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] px-5 py-10">
      <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
        <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(191,87,0,0.18),transparent_34%),#080E1A] p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-white/55 hover:text-white/80 transition-colors">
              <span className="w-8 h-8 rounded-lg bg-[#BF5700] flex items-center justify-center text-xs font-black text-white">UT</span>
              <span className="text-sm font-semibold tracking-wide">Premed Copilot</span>
            </Link>

            <div className="mt-12 max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#BF5700]/80">Sign In</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
                Access your data-driven premed workspace.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/55">
                Sign in with email to save your account, complete onboarding, and unlock your personalized dashboard, benchmarks, and school strategy tools.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mt-10">
            {[
              { label: "Personalized dashboard", value: "Real profile + cycle data" },
              { label: "Saved account", value: "Auth-backed settings + profile" },
              { label: "Protected workspace", value: "Session-gated app routes" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/30">{item.label}</p>
                <p className="mt-2 text-sm text-white/75">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
