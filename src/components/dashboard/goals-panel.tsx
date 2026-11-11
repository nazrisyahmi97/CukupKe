"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Lock,
  Pause,
  Play,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { calculateGoalPlan, formatMoney, toIsoDate } from "@/lib/finance";
import type { GoalMode, SavingsGoal } from "@/lib/types";

interface GoalsPanelProps {
  goals: SavingsGoal[];
  currency: string;
  monthlySurplusForGoals: number;
  onAddGoal: (
    goal: Omit<SavingsGoal, "id" | "user_id" | "created_at">
  ) => Promise<void>;
  onTopUpGoal: (goalId: string, amount: number) => Promise<void>;
  onToggleGoal: (goalId: string, updates: Partial<SavingsGoal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export function GoalsPanel({
  goals,
  currency,
  monthlySurplusForGoals,
  onAddGoal,
  onTopUpGoal,
  onToggleGoal,
  onDeleteGoal,
}: GoalsPanelProps) {
  const defaultTargetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return toIsoDate(d);
  }, []);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("0");
  const [mode, setMode] = useState<GoalMode>("by_date");
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [monthlyContribution, setMonthlyContribution] = useState("300");
  const [reserveInBudget, setReserveInBudget] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [topUpGoalId, setTopUpGoalId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");

  // Live preview of what the user is typing
  const previewPlan = useMemo(() => {
    const target = Number(targetAmount) || 0;
    if (target <= 0) return null;
    return calculateGoalPlan(
      {
        target_amount: target,
        saved_amount: Number(savedAmount) || 0,
        mode,
        target_date: mode === "by_date" ? targetDate : null,
        monthly_contribution: mode === "by_monthly" ? Number(monthlyContribution) || 1 : null,
        status: "active",
      },
      monthlySurplusForGoals
    );
  }, [targetAmount, savedAmount, mode, targetDate, monthlyContribution, monthlySurplusForGoals]);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(targetAmount);
    if (!name.trim() || !Number.isFinite(target) || target <= 0) return;

    setSubmitting(true);
    try {
      const saved = Math.max(0, Number(savedAmount) || 0);
      await onAddGoal({
        name: name.trim(),
        target_amount: target,
        saved_amount: saved,
        mode,
        target_date: mode === "by_date" ? targetDate : null,
        monthly_contribution:
          mode === "by_monthly" ? Math.max(1, Number(monthlyContribution) || 1) : null,
        reserve_in_budget: reserveInBudget,
        status: saved >= target ? "completed" : "active",
      });
      setName("");
      setTargetAmount("");
      setSavedAmount("0");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTopUpSubmit(goalId: string) {
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await onTopUpGoal(goalId, amount);
    setTopUpGoalId(null);
    setTopUpAmount("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Add Wishlist Goal + Live Calculator */}
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white text-base">
              New Wishlist / Savings Goal
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Plan what you want to buy, when you want it, and see how much to save.
          </p>

          <form onSubmit={handleCreateGoal} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                What do you want to buy or save for?
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. New Laptop, Japan Trip, Emergency Fund"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Target Price ({currency})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="4800"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Already Saved ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={savedAmount}
                  onChange={(e) => setSavedAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Mode Switch */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                How do you want to calculate?
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("by_date")}
                  className={`py-2 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    mode === "by_date"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  I have a Target Date
                </button>
                <button
                  type="button"
                  onClick={() => setMode("by_monthly")}
                  className={`py-2 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    mode === "by_monthly"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  I know Monthly Budget
                </button>
              </div>
            </div>

            {mode === "by_date" ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  When do you want to buy it?
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  How much can you save per month? ({currency})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <label className="flex items-start gap-2.5 rounded-xl bg-slate-950/70 border border-slate-800 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reserveInBudget}
                onChange={(e) => setReserveInBudget(e.target.checked)}
                className="mt-0.5 accent-emerald-500"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white block">Lock monthly saving in Safe-to-Spend</strong>
                Automatically deducts this goal&apos;s monthly share from your spendable cash.
              </span>
            </label>

            {/* Live Calculation Preview */}
            {previewPlan && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Live Plan Preview
                  </span>
                  <span>{previewPlan.progressPct}% funded</span>
                </div>

                {previewPlan.remaining === 0 ? (
                  <p className="text-white font-medium">You already have enough to buy this!</p>
                ) : (
                  <>
                    <p className="text-slate-200">
                      Need{" "}
                      <strong className="text-white font-mono">
                        {formatMoney(previewPlan.requiredMonthly, currency)}/mo
                      </strong>{" "}
                      · ~{formatMoney(previewPlan.requiredWeekly, currency)}/wk · ~
                      {formatMoney(previewPlan.requiredDaily, currency)}/day
                    </p>
                    {mode === "by_monthly" && previewPlan.estimatedDateIso && (
                      <p className="text-cyan-300">
                        Estimated ready in <strong>{previewPlan.monthsNeeded} months</strong> (
                        {previewPlan.estimatedDateIso})
                      </p>
                    )}
                    {previewPlan.isTightBudget && (
                      <p className="text-amber-300 flex items-center gap-1.5 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Exceeds your post-bills surplus ({formatMoney(monthlySurplusForGoals, currency)}
                        /mo). Consider extending the date.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {submitting ? "Adding..." : "Add Savings Goal"}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Goals List */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white text-base">
            Your Goals ({goals.length})
          </h2>
          <span className="text-xs text-slate-400">
            Post-bills monthly capacity:{" "}
            <strong className="text-slate-200 font-mono">
              {formatMoney(monthlySurplusForGoals, currency)}
            </strong>
          </span>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center text-sm text-slate-400">
            No savings goals yet. Add something you want to buy on the left!
          </div>
        ) : (
          goals.map((goal) => {
            const plan = calculateGoalPlan(goal, monthlySurplusForGoals);
            const badgeStyle =
              plan.statusLabel === "Ready to Buy!"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : plan.statusLabel === "Tight Budget" || plan.statusLabel === "Overdue"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : plan.statusLabel === "Paused"
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";

            return (
              <div
                key={goal.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-base">{goal.name}</h3>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeStyle}`}
                      >
                        {plan.statusLabel}
                      </span>
                      {goal.reserve_in_budget && goal.status === "active" && plan.remaining > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" />
                          Reserved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {formatMoney(goal.saved_amount, currency)} saved of{" "}
                      {formatMoney(goal.target_amount, currency)} ({plan.progressPct}%)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {plan.remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTopUpGoalId(topUpGoalId === goal.id ? null : goal.id);
                          setTopUpAmount("");
                        }}
                        className="text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        + Top Up
                      </button>
                    )}
                    <button
                      type="button"
                      title={goal.reserve_in_budget ? "Unlock from budget" : "Lock in budget"}
                      onClick={() =>
                        onToggleGoal(goal.id, {
                          reserve_in_budget: !goal.reserve_in_budget,
                        })
                      }
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        goal.reserve_in_budget
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                    {plan.remaining > 0 && (
                      <button
                        type="button"
                        title={goal.status === "paused" ? "Resume goal" : "Pause goal"}
                        onClick={() =>
                          onToggleGoal(goal.id, {
                            status: goal.status === "paused" ? "active" : "paused",
                          })
                        }
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {goal.status === "paused" ? (
                          <Play className="w-3.5 h-3.5" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete goal"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all ${
                      plan.progressPct >= 100
                        ? "bg-emerald-400"
                        : plan.isTightBudget
                        ? "bg-amber-400"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-400"
                    }`}
                    style={{ width: `${plan.progressPct}%` }}
                  />
                </div>

                {/* Breakdown Metrics */}
                {plan.remaining > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5">
                      <span className="text-slate-500 block">Remaining</span>
                      <span className="font-semibold text-white font-mono">
                        {formatMoney(plan.remaining, currency)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5">
                      <span className="text-slate-500 block">Monthly Needed</span>
                      <span className="font-semibold text-emerald-300 font-mono">
                        {formatMoney(plan.requiredMonthly, currency)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5">
                      <span className="text-slate-500 block">Daily Pace</span>
                      <span className="font-semibold text-slate-200 font-mono">
                        {formatMoney(plan.requiredDaily, currency)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Target ETA
                      </span>
                      <span className="font-semibold text-cyan-300 font-mono">
                        {plan.estimatedDateIso || "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-300 pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Goal funded 100% — ready to purchase!
                  </div>
                )}

                {/* Inline Top-Up Box */}
                {topUpGoalId === goal.id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      placeholder={`Amount (${currency})`}
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleTopUpSubmit(goal.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                    >
                      Save Top Up
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
