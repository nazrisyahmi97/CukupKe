"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { CURRENCIES } from "@/lib/finance";
import type { UserProfile } from "@/lib/types";

interface OnboardingModalProps {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

export function OnboardingModal({ profile, onSave }: OnboardingModalProps) {
  const [currency, setCurrency] = useState(profile.currency || "MYR");
  const [cycleDay, setCycleDay] = useState(String(profile.cycle_start_day || 1));
  const [income, setIncome] = useState(
    profile.monthly_income > 0 ? String(profile.monthly_income) : ""
  );
  const [savingsTarget, setSavingsTarget] = useState(
    profile.monthly_savings_target > 0 ? String(profile.monthly_savings_target) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        currency,
        cycle_start_day: Math.min(28, Math.max(1, Number(cycleDay) || 1)),
        monthly_income: Math.max(0, Number(income) || 0),
        monthly_savings_target: Math.max(0, Number(savingsTarget) || 0),
        onboarding_completed: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          Quick Setup
        </div>
        <h2 className="text-xl font-bold text-white">Set up your monthly baseline</h2>
        <p className="text-sm text-slate-400 mt-1 mb-5">
          We use this to calculate your Safe-to-Spend and goal feasibility. You can change it
          anytime in Settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Payday / Cycle Start Day (1–28)
              </label>
              <input
                type="number"
                min={1}
                max={28}
                required
                value={cycleDay}
                onChange={(e) => setCycleDay(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Monthly Take-Home Income ({currency})
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="e.g. 4500"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              General Monthly Savings Target ({currency})
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="e.g. 800"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : "Start Tracking"}
          </button>
        </form>
      </div>
    </div>
  );
}
