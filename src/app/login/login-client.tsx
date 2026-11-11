"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  PiggyBank,
  Play,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup" | "magic";

export function LoginClient({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? "Authentication failed. Please try again." : null
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    setMessage(null);
    if (!supabaseConfigured) {
      setError(
        "Supabase credentials are not configured in .env.local yet. Use Demo Mode below to preview the app now!"
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (oauthErr) {
      setError(oauthErr.message);
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabaseConfigured) {
      setError(
        "Supabase credentials are not configured in .env.local yet. Use Demo Mode below to preview the app now!"
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    try {
      if (mode === "magic") {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (otpErr) throw otpErr;
        setMessage("Check your inbox for your 1-click sign-in link!");
      } else if (mode === "signup") {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (signUpErr) throw signUpErr;
        if (data.session) {
          router.push("/dashboard");
          return;
        }
        setMessage("Account created! Check your email to confirm and sign in.");
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Sign in to Cukup<span className="text-emerald-400">Ke</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Free Google login or Email / Magic Link (supports Gmail, iCloud, or any email).
          </p>

          {!supabaseConfigured && (
            <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 leading-relaxed">
              <p className="font-semibold text-amber-300 mb-1">Local Preview Mode Ready</p>
              <p>
                <code>.env.local</code> isn&apos;t linked to a Supabase project yet. You can try the
                full interactive app immediately via <strong>Preview Demo Mode</strong> below!
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <div className="flex-1 h-px bg-slate-800" />
            <span>or use email (Gmail / iCloud)</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Auth Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs">
            {(
              [
                { id: "signin", label: "Sign In" },
                { id: "signup", label: "Register" },
                { id: "magic", label: "Magic Link" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  setError(null);
                  setMessage(null);
                }}
                className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  mode === tab.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nazri"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com or you@icloud.com"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {mode !== "magic" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {mode === "magic" ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Send Magic Link
                </>
              ) : mode === "signup" ? (
                <>
                  <Mail className="w-4 h-4" />
                  Create Free Account
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Sign In with Email
                </>
              )}
            </button>
          </form>

          {/* Instant Demo Button */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={() => router.push("/dashboard?demo=1")}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium py-2.5 px-4 text-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Preview Interactive Demo (No Login Needed)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
