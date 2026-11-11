"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  Info,
  Plus,
  Target,
  Wallet,
} from "lucide-react";
import { formatMoney, toIsoDate } from "@/lib/finance";
import {
  MALAYSIA_LOAN_DEFAULTS,
  assessMalaysiaDsr,
  calculateMalaysiaLoan,
  type InterestMethod,
  type LoanKind,
} from "@/lib/loans";
import type { Category, RecurringBill, SavingsGoal } from "@/lib/types";

interface LoanCalculatorPanelProps {
  currency: string;
  monthlyIncome: number;
  existingFixedBills: number;
  safeToSpend: number;
  categories: Category[];
  onAddBill: (bill: Omit<RecurringBill, "id" | "user_id">) => Promise<void>;
  onAddGoal: (
    goal: Omit<SavingsGoal, "id" | "user_id" | "created_at">
  ) => Promise<void>;
  onNavigateTab: (tab: "goals" | "bills") => void;
}

export function LoanCalculatorPanel({
  currency,
  monthlyIncome,
  existingFixedBills,
  safeToSpend,
  categories,
  onAddBill,
  onAddGoal,
  onNavigateTab,
}: LoanCalculatorPanelProps) {
  const [kind, setKind] = useState<LoanKind>("housing");
  const defaults = MALAYSIA_LOAN_DEFAULTS[kind];

  const [assetPrice, setAssetPrice] = useState(String(defaults.defaultPrice));
  const [downpaymentPct, setDownpaymentPct] = useState(
    String(defaults.defaultDownpaymentPct)
  );
  const [annualRate, setAnnualRate] = useState(String(defaults.defaultRate));
  const [tenureYears, setTenureYears] = useState(String(defaults.defaultTenure));
  const [method, setMethod] = useState<InterestMethod>(defaults.defaultMethod);
  const [notice, setNotice] = useState<string | null>(null);

  function selectKind(nextKind: LoanKind) {
    const next = MALAYSIA_LOAN_DEFAULTS[nextKind];
    setKind(nextKind);
    setAssetPrice(String(next.defaultPrice));
    setDownpaymentPct(String(next.defaultDownpaymentPct));
    setAnnualRate(String(next.defaultRate));
    setTenureYears(String(next.defaultTenure));
    setMethod(next.defaultMethod);
    setNotice(null);
  }

  const parsedPrice = Math.max(0, Number(assetPrice) || 0);
  const parsedDownPct = kind === "personal" ? 0 : Math.min(90, Math.max(0, Number(downpaymentPct) || 0));
  const downpaymentAmount = (parsedPrice * parsedDownPct) / 100;

  const result = useMemo(
    () =>
      calculateMalaysiaLoan({
        kind,
        assetPrice: parsedPrice,
        downpaymentAmount,
        annualRate: Number(annualRate) || 0,
        tenureYears: Math.min(defaults.maxTenure, Math.max(1, Number(tenureYears) || 1)),
        method,
      }),
    [kind, parsedPrice, downpaymentAmount, annualRate, tenureYears, defaults.maxTenure, method]
  );

  const dsr = useMemo(
    () =>
      assessMalaysiaDsr(
        monthlyIncome,
        existingFixedBills,
        result.monthlyInstallment
      ),
    [monthlyIncome, existingFixedBills, result.monthlyInstallment]
  );

  const principalPct =
    result.totalPayment > 0
      ? Math.round((result.principal / result.totalPayment) * 100)
      : 100;

  async function handleSaveInstallmentAsBill() {
    if (result.monthlyInstallment <= 0) return;
    const housingCat =
      categories.find((c) => c.name.toLowerCase().includes("housing"))?.id ||
      categories[0]?.id ||
      null;
    const transportCat =
      categories.find((c) => c.name.toLowerCase().includes("transport"))?.id ||
      categories[0]?.id ||
      null;

    const categoryId = kind === "car" ? transportCat : housingCat;
    const billName =
      kind === "housing"
        ? "Housing Loan Installment"
        : kind === "car"
        ? "Car Loan Installment"
        : "Personal Loan Installment";

    await onAddBill({
      name: billName,
      amount: Number(result.monthlyInstallment.toFixed(2)),
      category_id: categoryId,
      due_day: 1,
      is_active: true,
    });
    setNotice(`Added "${billName}" to your Recurring Bills!`);
  }

  async function handleCreateDownpaymentGoal() {
    if (result.downpayment <= 0) return;
    const d = new Date();
    d.setMonth(d.getMonth() + 12);

    const goalName =
      kind === "housing" ? "House Downpayment" : "Car Downpayment";

    await onAddGoal({
      name: goalName,
      target_amount: Number(result.downpayment.toFixed(2)),
      saved_amount: 0,
      mode: "by_date",
      target_date: toIsoDate(d),
      monthly_contribution: null,
      reserve_in_budget: true,
      status: "active",
    });
    setNotice(`Created "${goalName}" in Savings Goals!`);
  }

  return (
    <div className="space-y-6">
      {/* Loan Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(
          [
            { id: "housing", icon: Building2 },
            { id: "car", icon: Car },
            { id: "personal", icon: Wallet },
          ] as const
        ).map(({ id, icon: Icon }) => {
          const item = MALAYSIA_LOAN_DEFAULTS[id];
          const active = kind === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectKind(id)}
              className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                active
                  ? "border-emerald-500/45 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-950 text-slate-400 border border-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() =>
              onNavigateTab(notice.includes("Goal") ? "goals" : "bills")
            }
            className="font-semibold underline text-emerald-300 cursor-pointer"
          >
            View now →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white text-base">
              {defaults.label} Inputs
            </h2>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {defaults.assetLabel} ({currency})
            </label>
            <input
              type="number"
              min={0}
              step="100"
              value={assetPrice}
              onChange={(e) => setAssetPrice(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {kind !== "personal" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Downpayment (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  step="1"
                  value={downpaymentPct}
                  onChange={(e) => setDownpaymentPct(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Downpayment ({currency})
                </label>
                <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 px-3.5 py-2.5 text-sm text-slate-300 font-mono">
                  {formatMoney(downpaymentAmount, currency)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step="0.05"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Tenure (1–{defaults.maxTenure} yrs)
              </label>
              <input
                type="number"
                min={1}
                max={defaults.maxTenure}
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Calculation Rule
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMethod("reducing")}
                className={`py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  method === "reducing"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Reducing Balance
              </button>
              <button
                type="button"
                onClick={() => setMethod("flat")}
                className={`py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  method === "flat"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Flat Rate (HP/Personal)
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{defaults.ruleNote}</span>
          </div>
        </div>

        {/* Right: Results + Malaysia DSR Check */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Monthly Installment Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-300 font-medium">
                  Estimated Monthly Installment
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-white font-mono mt-1">
                  {formatMoney(result.monthlyInstallment, currency)}
                  <span className="text-sm font-normal text-slate-300"> / mo</span>
                </p>
                <p className="text-xs text-slate-300 mt-1.5">
                  Loan Principal: <strong className="font-mono">{formatMoney(result.principal, currency)}</strong> ·{" "}
                  {result.months} months
                  {method === "flat" && result.effectiveAnnualRate > 0 && (
                    <> · Effective Rate (EIR): ~{result.effectiveAnnualRate.toFixed(2)}% p.a.</>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs">
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
                <span className="text-slate-400 block">Loan Principal</span>
                <span className="font-mono font-semibold text-white text-sm">
                  {formatMoney(result.principal, currency)}
                </span>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
                <span className="text-slate-400 block">Total Interest</span>
                <span className="font-mono font-semibold text-amber-300 text-sm">
                  {formatMoney(result.totalInterest, currency)}
                </span>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
                <span className="text-slate-400 block">Total Repayment</span>
                <span className="font-mono font-semibold text-cyan-300 text-sm">
                  {formatMoney(result.totalPayment, currency)}
                </span>
              </div>
            </div>

            {/* Principal vs Interest Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Principal ({principalPct}%)</span>
                <span>Interest ({100 - principalPct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${principalPct}%` }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${100 - principalPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* CukupKe DSR & Affordability Check */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-base">
                CukupKe? Malaysia DSR & Budget Check
              </h3>
              {dsr && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    dsr.status === "Healthy"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : dsr.status === "Moderate"
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                      : dsr.status === "High"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  }`}
                >
                  DSR {dsr.dsrPercent}% · {dsr.status}
                </span>
              )}
            </div>

            {dsr ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
                    <span className="text-slate-400 block">Your Income</span>
                    <span className="font-mono font-semibold text-white text-sm">
                      {formatMoney(monthlyIncome, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
                    <span className="text-slate-400 block">
                      Bills + This Loan
                    </span>
                    <span className="font-mono font-semibold text-slate-200 text-sm">
                      {formatMoney(dsr.newTotalCommitments, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
                    <span className="text-slate-400 block">
                      New Safe-to-Spend
                    </span>
                    <span
                      className={`font-mono font-semibold text-sm ${
                        safeToSpend - result.monthlyInstallment >= 0
                          ? "text-emerald-300"
                          : "text-rose-400"
                      }`}
                    >
                      {formatMoney(safeToSpend - result.monthlyInstallment, currency)}
                    </span>
                  </div>
                </div>

                {dsr.dsrPercent > 60 && (
                  <p className="text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Malaysian banks typically cap Debt Service Ratio (DSR) around 60%–70%.
                    Consider a larger downpayment or longer tenure.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Set your <strong>Base Monthly Income</strong> in Settings to see your
                Malaysia Debt Service Ratio (DSR) and Safe-to-Spend impact.
              </p>
            )}

            {/* Quick Action Connectors */}
            <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveInstallmentAsBill}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Installment to Recurring Bills
              </button>

              {result.downpayment > 0 && (
                <button
                  type="button"
                  onClick={handleCreateDownpaymentGoal}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  Save {formatMoney(result.downpayment, currency)} Downpayment as Goal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
