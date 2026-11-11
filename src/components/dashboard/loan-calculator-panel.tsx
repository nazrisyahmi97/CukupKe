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
  const parsedDownPct =
    kind === "personal" ? 0 : Math.min(90, Math.max(0, Number(downpaymentPct) || 0));
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

    const goalName = kind === "housing" ? "House Downpayment" : "Car Downpayment";

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
                  ? "border-[#52b788] bg-[#e6f6ec] shadow-xs"
                  : "border-[#e2dfd7] bg-white hover:border-[#c8c3b8]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active
                      ? "bg-[#d8f3dc] text-[#2d6a4f] border border-[#b7e4c7]"
                      : "bg-[#f7f6f2] text-[#4a524d] border border-[#e2dfd7]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1f2421]">{item.label}</p>
                  <p className="text-[11px] text-[#4a524d]">{item.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {notice && (
        <div className="rounded-xl border border-[#b7e4c7] bg-[#e6f6ec] px-4 py-3 text-xs text-[#23543e] flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() =>
              onNavigateTab(notice.includes("Goal") ? "goals" : "bills")
            }
            className="font-semibold underline text-[#1b4332] cursor-pointer"
          >
            View now →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-5 rounded-2xl border border-[#e2dfd7] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#2d6a4f]" />
            <h2 className="font-semibold text-[#1f2421] text-base">
              {defaults.label} Inputs
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a524d] mb-1">
              {defaults.assetLabel} ({currency})
            </label>
            <input
              type="number"
              min={0}
              step="100"
              value={assetPrice}
              onChange={(e) => setAssetPrice(e.target.value)}
              className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
            />
          </div>

          {kind !== "personal" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a524d] mb-1">
                  Downpayment (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  step="1"
                  value={downpaymentPct}
                  onChange={(e) => setDownpaymentPct(e.target.value)}
                  className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a524d] mb-1">
                  Downpayment ({currency})
                </label>
                <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] px-3.5 py-2.5 text-sm text-[#4a524d] font-mono">
                  {formatMoney(downpaymentAmount, currency)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a524d] mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step="0.05"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a524d] mb-1">
                Tenure (1–{defaults.maxTenure} yrs)
              </label>
              <input
                type="number"
                min={1}
                max={defaults.maxTenure}
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a524d] mb-1.5">
              Calculation Rule
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] text-xs">
              <button
                type="button"
                onClick={() => setMethod("reducing")}
                className={`py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  method === "reducing"
                    ? "bg-white text-[#1f2421] shadow-xs"
                    : "text-[#656d67] hover:text-[#1f2421]"
                }`}
              >
                Reducing Balance
              </button>
              <button
                type="button"
                onClick={() => setMethod("flat")}
                className={`py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  method === "flat"
                    ? "bg-white text-[#1f2421] shadow-xs"
                    : "text-[#656d67] hover:text-[#1f2421]"
                }`}
              >
                Flat Rate (HP/Personal)
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] p-3 text-xs text-[#4a524d] flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-[#2d6a4f] shrink-0 mt-0.5" />
            <span>{defaults.ruleNote}</span>
          </div>
        </div>

        {/* Right: Results + Malaysia DSR Check */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Monthly Installment Card */}
          <div className="rounded-2xl border border-[#b7e4c7] bg-[#e6f6ec] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#2d6a4f] font-semibold">
                  Estimated Monthly Installment
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-[#1f2421] font-mono mt-1">
                  {formatMoney(result.monthlyInstallment, currency)}
                  <span className="text-sm font-normal text-[#4a524d]"> / mo</span>
                </p>
                <p className="text-xs text-[#4a524d] mt-1.5">
                  Loan Principal:{" "}
                  <strong className="font-mono text-[#1f2421]">
                    {formatMoney(result.principal, currency)}
                  </strong>{" "}
                  · {result.months} months
                  {method === "flat" && result.effectiveAnnualRate > 0 && (
                    <> · Effective Rate (EIR): ~{result.effectiveAnnualRate.toFixed(2)}% p.a.</>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs">
              <div className="rounded-xl bg-white border border-[#ccebd7] p-3">
                <span className="text-[#656d67] block">Loan Principal</span>
                <span className="font-mono font-semibold text-[#1f2421] text-sm">
                  {formatMoney(result.principal, currency)}
                </span>
              </div>
              <div className="rounded-xl bg-white border border-[#ccebd7] p-3">
                <span className="text-[#656d67] block">Total Interest</span>
                <span className="font-mono font-semibold text-[#b45309] text-sm">
                  {formatMoney(result.totalInterest, currency)}
                </span>
              </div>
              <div className="rounded-xl bg-white border border-[#ccebd7] p-3">
                <span className="text-[#656d67] block">Total Repayment</span>
                <span className="font-mono font-semibold text-[#2d6a4f] text-sm">
                  {formatMoney(result.totalPayment, currency)}
                </span>
              </div>
            </div>

            {/* Principal vs Interest Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] text-[#23543e] font-medium">
                <span>Principal ({principalPct}%)</span>
                <span>Interest ({100 - principalPct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white overflow-hidden flex border border-[#b7e4c7]">
                <div
                  className="bg-[#52b788] h-full"
                  style={{ width: `${principalPct}%` }}
                />
                <div
                  className="bg-[#d4a373] h-full"
                  style={{ width: `${100 - principalPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* CukupKe DSR & Affordability Check */}
          <div className="rounded-2xl border border-[#e2dfd7] bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1f2421] text-base">
                CukupKe? Malaysia DSR & Budget Check
              </h3>
              {dsr && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    dsr.status === "Healthy"
                      ? "bg-[#d8f3dc] text-[#1b4332] border-[#b7e4c7]"
                      : dsr.status === "Moderate"
                      ? "bg-[#e6f6ec] text-[#2d6a4f] border-[#ccebd7]"
                      : dsr.status === "High"
                      ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                      : "bg-[#fdecec] text-[#9b2c2c] border-[#f2c6c6]"
                  }`}
                >
                  DSR {dsr.dsrPercent}% · {dsr.status}
                </span>
              )}
            </div>

            {dsr ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] p-3">
                    <span className="text-[#656d67] block">Your Income</span>
                    <span className="font-mono font-semibold text-[#1f2421] text-sm">
                      {formatMoney(monthlyIncome, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] p-3">
                    <span className="text-[#656d67] block">Bills + This Loan</span>
                    <span className="font-mono font-semibold text-[#1f2421] text-sm">
                      {formatMoney(dsr.newTotalCommitments, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] p-3">
                    <span className="text-[#656d67] block">New Safe-to-Spend</span>
                    <span
                      className={`font-mono font-semibold text-sm ${
                        safeToSpend - result.monthlyInstallment >= 0
                          ? "text-[#2d6a4f]"
                          : "text-[#c94a4a]"
                      }`}
                    >
                      {formatMoney(safeToSpend - result.monthlyInstallment, currency)}
                    </span>
                  </div>
                </div>

                {dsr.dsrPercent > 60 && (
                  <p className="text-[#92400e] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#b45309]" />
                    Malaysian banks typically cap Debt Service Ratio (DSR) around 60%–70%.
                    Consider a larger downpayment or longer tenure.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#4a524d]">
                Set your <strong>Base Monthly Income</strong> in Settings to see your
                Malaysia Debt Service Ratio (DSR) and Safe-to-Spend impact.
              </p>
            )}

            {/* Quick Action Connectors */}
            <div className="flex flex-wrap gap-2.5 pt-2 border-t border-[#e2dfd7]">
              <button
                type="button"
                onClick={handleSaveInstallmentAsBill}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1f2421] hover:bg-[#323a35] text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Installment to Recurring Bills
              </button>

              {result.downpayment > 0 && (
                <button
                  type="button"
                  onClick={handleCreateDownpaymentGoal}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#e6f6ec] hover:bg-[#d8f3dc] text-[#23543e] border border-[#b7e4c7] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
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
