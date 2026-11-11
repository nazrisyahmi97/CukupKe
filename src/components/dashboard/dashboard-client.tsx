"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  PiggyBank,
  Plus,
  Receipt,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { createDemoState } from "@/lib/demo-data";
import {
  CURRENCIES,
  computeCycleSummary,
  formatMoney,
  toIsoDate,
} from "@/lib/finance";
import {
  loadDemoFromStorage,
  loadSupabaseFinanceState,
  resetDemoStorage,
  saveDemoToStorage,
} from "@/lib/finance-store";
import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  FinanceState,
  RecurringBill,
  SavingsGoal,
  TransactionType,
  UserProfile,
} from "@/lib/types";
import { BillsBudgetsPanel } from "./bills-budgets-panel";
import { GoalsPanel } from "./goals-panel";
import { LoanCalculatorPanel } from "./loan-calculator-panel";
import { OnboardingModal } from "./onboarding-modal";

type TabId = "overview" | "goals" | "bills" | "loans" | "settings";

interface DashboardClientProps {
  mode: "demo" | "supabase";
  userId?: string;
  userEmail?: string | null;
  userFullName?: string | null;
}

export function DashboardClient({
  mode,
  userId,
  userEmail,
  userFullName,
}: DashboardClientProps) {
  const router = useRouter();
  const [state, setState] = useState<FinanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [cycleOffset, setCycleOffset] = useState(0);

  // Quick-add transaction state
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(() => toIsoDate(new Date()));
  const [txFilter, setTxFilter] = useState<"all" | "expense" | "income">("all");
  const [addingTx, setAddingTx] = useState(false);

  // Load state on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (mode === "demo") {
          const demo = loadDemoFromStorage(() => createDemoState());
          if (!cancelled) {
            setState(demo);
            setTxCategoryId(demo.categories[0]?.id || "");
          }
          return;
        }

        const supabase = createClient();
        if (!supabase || !userId) {
          throw new Error("Supabase session unavailable.");
        }
        const loaded = await loadSupabaseFinanceState(
          supabase,
          userId,
          userFullName ?? null
        );
        if (!cancelled) {
          setState(loaded);
          setTxCategoryId(loaded.categories[0]?.id || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [mode, userId, userFullName]);

  const summary = useMemo(() => {
    if (!state) return null;
    return computeCycleSummary(state, cycleOffset);
  }, [state, cycleOffset]);

  function commitDemoState(updater: (prev: FinanceState) => FinanceState) {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveDemoToStorage(next);
      return next;
    });
  }

  async function handleUpdateProfile(updates: Partial<UserProfile>) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase || !userId) return;
    const { data, error: err } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) => (prev ? { ...prev, profile: data as UserProfile } : prev));
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    const amount = Number(txAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setAddingTx(true);
    try {
      const categoryId = txType === "expense" ? txCategoryId || null : null;
      const payload = {
        type: txType,
        amount,
        category_id: categoryId,
        description: txDescription.trim() || (txType === "income" ? "Extra income" : "Expense"),
        tx_date: txDate,
        bill_id: null,
      };

      if (mode === "demo") {
        commitDemoState((prev) => ({
          ...prev,
          transactions: [
            { id: crypto.randomUUID(), ...payload },
            ...prev.transactions,
          ],
        }));
      } else {
        const supabase = createClient();
        if (!supabase || !userId) return;
        const { data, error: err } = await supabase
          .from("transactions")
          .insert({ ...payload, user_id: userId })
          .select()
          .single();
        if (err) throw new Error(err.message);
        setState((prev) =>
          prev ? { ...prev, transactions: [data, ...prev.transactions] } : prev
        );
      }

      setTxAmount("");
      setTxDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add transaction.");
    } finally {
      setAddingTx(false);
    }
  }

  async function handleDeleteTransaction(txId: string) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== txId),
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    const { error: err } = await supabase.from("transactions").delete().eq("id", txId);
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev
        ? { ...prev, transactions: prev.transactions.filter((t) => t.id !== txId) }
        : prev
    );
  }

  async function handleAddGoal(
    goal: Omit<SavingsGoal, "id" | "user_id" | "created_at">
  ) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        goals: [...prev.goals, { id: crypto.randomUUID(), ...goal }],
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase || !userId) return;
    const { data, error: err } = await supabase
      .from("savings_goals")
      .insert({ ...goal, user_id: userId })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) => (prev ? { ...prev, goals: [...prev.goals, data] } : prev));
  }

  async function handleTopUpGoal(goalId: string, amount: number) {
    if (!state) return;
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const nextSaved = Number(goal.saved_amount) + amount;
    const nextStatus = nextSaved >= goal.target_amount ? "completed" : goal.status;

    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId ? { ...g, saved_amount: nextSaved, status: nextStatus } : g
        ),
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from("savings_goals")
      .update({ saved_amount: nextSaved, status: nextStatus })
      .eq("id", goalId)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev
        ? { ...prev, goals: prev.goals.map((g) => (g.id === goalId ? data : g)) }
        : prev
    );
  }

  async function handleToggleGoal(goalId: string, updates: Partial<SavingsGoal>) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from("savings_goals")
      .update(updates)
      .eq("id", goalId)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev
        ? { ...prev, goals: prev.goals.map((g) => (g.id === goalId ? data : g)) }
        : prev
    );
  }

  async function handleDeleteGoal(goalId: string) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== goalId),
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    const { error: err } = await supabase.from("savings_goals").delete().eq("id", goalId);
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev ? { ...prev, goals: prev.goals.filter((g) => g.id !== goalId) } : prev
    );
  }

  async function handleAddBill(bill: Omit<RecurringBill, "id" | "user_id">) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        bills: [...prev.bills, { id: crypto.randomUUID(), ...bill }],
      }));
      return;
    }
    const supabase = createClient();
    if (!supabase || !userId) return;
    const { data, error: err } = await supabase
      .from("recurring_bills")
      .insert({ ...bill, user_id: userId })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) => (prev ? { ...prev, bills: [...prev.bills, data] } : prev));
  }

  async function handleToggleBill(billId: string, isActive: boolean) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        bills: prev.bills.map((b) =>
          b.id === billId ? { ...b, is_active: isActive } : b
        ),
      }));
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from("recurring_bills")
      .update({ is_active: isActive })
      .eq("id", billId)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev
        ? { ...prev, bills: prev.bills.map((b) => (b.id === billId ? data : b)) }
        : prev
    );
  }

  async function handleDeleteBill(billId: string) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        bills: prev.bills.filter((b) => b.id !== billId),
      }));
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const { error: err } = await supabase.from("recurring_bills").delete().eq("id", billId);
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev ? { ...prev, bills: prev.bills.filter((b) => b.id !== billId) } : prev
    );
  }

  async function handleApplyPendingBills() {
    if (!state || !summary || summary.pendingBills.length === 0) return;

    const todayIso = toIsoDate(new Date());
    const clampedDate =
      todayIso >= summary.cycle.startIso && todayIso <= summary.cycle.endIso
        ? todayIso
        : summary.cycle.startIso;

    const rows = summary.pendingBills.map((bill) => ({
      type: "expense" as const,
      amount: bill.amount,
      category_id: bill.category_id,
      description: bill.name,
      tx_date: clampedDate,
      bill_id: bill.id,
    }));

    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        transactions: [
          ...rows.map((r) => ({ id: crypto.randomUUID(), ...r })),
          ...prev.transactions,
        ],
      }));
      return;
    }

    const supabase = createClient();
    if (!supabase || !userId) return;
    const { data, error: err } = await supabase
      .from("transactions")
      .insert(rows.map((r) => ({ ...r, user_id: userId })))
      .select();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev ? { ...prev, transactions: [...(data ?? []), ...prev.transactions] } : prev
    );
  }

  async function handleAddCategory(cat: Omit<Category, "id" | "user_id">) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        categories: [...prev.categories, { id: crypto.randomUUID(), ...cat }],
      }));
      return;
    }
    const supabase = createClient();
    if (!supabase || !userId) return;
    const { data, error: err } = await supabase
      .from("categories")
      .insert({ ...cat, user_id: userId })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev ? { ...prev, categories: [...prev.categories, data] } : prev
    );
  }

  async function handleUpdateCategory(catId: string, updates: Partial<Category>) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId ? { ...c, ...updates } : c
        ),
      }));
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", catId)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev
        ? { ...prev, categories: prev.categories.map((c) => (c.id === catId ? data : c)) }
        : prev
    );
  }

  async function handleDeleteCategory(catId: string) {
    if (!state) return;
    if (mode === "demo") {
      commitDemoState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== catId),
      }));
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const { error: err } = await supabase.from("categories").delete().eq("id", catId);
    if (err) {
      setError(err.message);
      return;
    }
    setState((prev) =>
      prev
        ? { ...prev, categories: prev.categories.filter((c) => c.id !== catId) }
        : prev
    );
  }

  function handleExportCsv() {
    if (!state || !summary) return;
    const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
    const header = ["Date", "Type", "Category", "Description", "Amount"];
    const lines = summary.cycleTransactions.map((tx) =>
      [
        tx.tx_date,
        tx.type,
        tx.category_id ? catMap.get(tx.category_id) || "Uncategorized" : "Income",
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount.toFixed(2),
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cukupke-${summary.cycle.startIso}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#656d67] text-sm">
        Loading your finance control center...
      </div>
    );
  }

  if (!state || !summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-[#c94a4a] text-sm mb-3">
          {error || "Unable to load finance data."}
        </p>
        <Link href="/login" className="text-sm text-[#2d6a4f] underline">
          Return to Sign In
        </Link>
      </div>
    );
  }

  const currency = state.profile.currency || "MYR";
  const pendingBillIds = new Set(summary.pendingBills.map((b) => b.id));
  const filteredTransactions = summary.cycleTransactions.filter((t) =>
    txFilter === "all" ? true : t.type === txFilter
  );

  // 50 / 30 / 20 percentages relative to totalIncome
  const denom = Math.max(1, summary.totalIncome);
  const needPct = Math.round((summary.bucketTotals.need / denom) * 100);
  const wantPct = Math.round((summary.bucketTotals.want / denom) * 100);
  const savePct = Math.round((summary.bucketTotals.saving / denom) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#1f2421]">
      {!state.profile.onboarding_completed && (
        <OnboardingModal profile={state.profile} onSave={handleUpdateProfile} />
      )}

      {/* Demo Banner */}
      {mode === "demo" && (
        <div className="bg-[#d8f3dc] border-b border-[#b7e4c7] px-4 py-2 text-xs text-[#1b4332] flex flex-wrap items-center justify-center gap-3">
          <span>
            <strong>Interactive Demo Mode</strong> — changes are saved locally in your browser.
          </span>
          <button
            type="button"
            onClick={() => {
              const reset = resetDemoStorage(() => createDemoState());
              setState(reset);
            }}
            className="inline-flex items-center gap-1 underline hover:text-[#0f291e] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset demo data
          </button>
          <Link href="/login" className="underline font-semibold text-[#2d6a4f]">
            Sign in with Google / Email
          </Link>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#e2dfd7] bg-[#f7f6f2]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#d8f3dc] border border-[#b7e4c7] flex items-center justify-center text-[#2d6a4f]">
                <PiggyBank className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[#1f2421]">
                Cukup<span className="text-[#2d6a4f]">Ke</span>
              </span>
            </Link>

            {/* Cycle Switcher */}
            <div className="flex items-center gap-1 rounded-xl bg-white border border-[#e2dfd7] px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => setCycleOffset((o) => o - 1)}
                className="p-1 text-[#656d67] hover:text-[#1f2421] cursor-pointer"
                title="Previous cycle"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium text-[#1f2421] min-w-[130px] text-center">
                {summary.cycle.label}
              </span>
              <button
                type="button"
                onClick={() => setCycleOffset((o) => o + 1)}
                className="p-1 text-[#656d67] hover:text-[#1f2421] cursor-pointer"
                title="Next cycle"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === "supabase" && (
              <>
                <span className="hidden sm:inline text-xs text-[#4a524d]">
                  {state.profile.full_name || userEmail}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-xs text-[#4a524d] hover:text-[#1f2421] border border-[#dcd8cf] bg-white px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto pb-2">
          {(
            [
              { id: "overview", label: "Overview", icon: Wallet },
              { id: "goals", label: "Savings Goals", icon: Target },
              { id: "bills", label: "Bills & Budgets", icon: Receipt },
              { id: "loans", label: "Loans (MY)", icon: Calculator },
              { id: "settings", label: "Settings", icon: Settings },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#1f2421] text-[#f7f6f2]"
                    : "text-[#4a524d] hover:text-[#1f2421] hover:bg-[#efece6]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-[#f2c6c6] bg-[#fdecec] px-4 py-3 text-xs text-[#9b2c2c] flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`rounded-2xl border p-4 ${
                  summary.safeToSpend >= 0
                    ? "border-[#b7e4c7] bg-[#e6f6ec]"
                    : "border-[#f2c6c6] bg-[#fdecec]"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    summary.safeToSpend >= 0 ? "text-[#2d6a4f]" : "text-[#9b2c2c]"
                  }`}
                >
                  Safe-to-Spend
                </p>
                <p className="text-2xl font-bold text-[#1f2421] font-mono mt-1">
                  {formatMoney(summary.safeToSpend, currency)}
                </p>
                <p className="text-xs text-[#4a524d] mt-1">
                  {cycleOffset === 0
                    ? `~${formatMoney(summary.dailyAllowance, currency)}/day (${summary.cycle.daysRemaining}d left)`
                    : `${summary.cycle.totalDays} days in cycle`}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e2dfd7] bg-white p-4 shadow-xs">
                <p className="text-xs font-medium uppercase tracking-wider text-[#656d67]">
                  Cycle Income
                </p>
                <p className="text-2xl font-bold text-[#1f2421] font-mono mt-1">
                  {formatMoney(summary.totalIncome, currency)}
                </p>
                <p className="text-xs text-[#656d67] mt-1">
                  Base {formatMoney(summary.baseIncome, currency)} +{" "}
                  {formatMoney(summary.extraIncome, currency)} extra
                </p>
              </div>

              <div className="rounded-2xl border border-[#e2dfd7] bg-white p-4 shadow-xs">
                <p className="text-xs font-medium uppercase tracking-wider text-[#656d67]">
                  Spent + Pending Bills
                </p>
                <p className="text-2xl font-bold text-[#1f2421] font-mono mt-1">
                  {formatMoney(summary.totalSpent + summary.pendingBillsTotal, currency)}
                </p>
                <p className="text-xs text-[#656d67] mt-1">
                  {formatMoney(summary.totalSpent, currency)} spent ·{" "}
                  {formatMoney(summary.pendingBillsTotal, currency)} unpaid bills
                </p>
              </div>

              <div className="rounded-2xl border border-[#e2dfd7] bg-white p-4 shadow-xs">
                <p className="text-xs font-medium uppercase tracking-wider text-[#2d6a4f]">
                  Locked Monthly Savings
                </p>
                <p className="text-2xl font-bold text-[#1f2421] font-mono mt-1">
                  {formatMoney(summary.totalLockedSavings, currency)}
                </p>
                <p className="text-xs text-[#656d67] mt-1">
                  {formatMoney(summary.generalSavingsTarget, currency)} base +{" "}
                  {formatMoney(summary.goalReservedMonthly, currency)} goals
                </p>
              </div>
            </div>

            {/* Middle Row: Quick-Add + 50/30/20 + Category Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Quick-Add + 50/30/20 */}
              <div className="lg:col-span-5 space-y-5">
                <div className="rounded-2xl border border-[#e2dfd7] bg-white p-5 shadow-xs">
                  <h2 className="font-semibold text-[#1f2421] text-base mb-3">
                    Quick Add Transaction
                  </h2>

                  <form onSubmit={handleAddTransaction} className="space-y-3">
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] text-xs">
                      <button
                        type="button"
                        onClick={() => setTxType("expense")}
                        className={`py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          txType === "expense"
                            ? "bg-[#fdecec] text-[#9b2c2c]"
                            : "text-[#656d67] hover:text-[#1f2421]"
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxType("income")}
                        className={`py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                          txType === "income"
                            ? "bg-[#d8f3dc] text-[#1b4332]"
                            : "text-[#656d67] hover:text-[#1f2421]"
                        }`}
                      >
                        Extra Income
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#4a524d] mb-1">
                          Amount ({currency})
                        </label>
                        <input
                          type="number"
                          required
                          min={0.01}
                          step="0.01"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          placeholder="15.50"
                          className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3 py-2 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4a524d] mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={txDate}
                          onChange={(e) => setTxDate(e.target.value)}
                          className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3 py-2 text-sm text-[#1f2421] focus:outline-none focus:border-[#52b788] focus:bg-white"
                        />
                      </div>
                    </div>

                    {txType === "expense" && (
                      <div>
                        <label className="block text-xs font-medium text-[#4a524d] mb-1">
                          Category
                        </label>
                        <select
                          value={txCategoryId}
                          onChange={(e) => setTxCategoryId(e.target.value)}
                          className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3 py-2 text-sm text-[#1f2421] focus:outline-none focus:border-[#52b788] focus:bg-white"
                        >
                          {state.categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.bucket})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-[#4a524d] mb-1">
                        Note (optional)
                      </label>
                      <input
                        type="text"
                        value={txDescription}
                        onChange={(e) => setTxDescription(e.target.value)}
                        placeholder={
                          txType === "expense"
                            ? "e.g. Lunch, Petrol, Groceries"
                            : "e.g. Side gig, Bonus"
                        }
                        className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3 py-2 text-sm text-[#1f2421] placeholder:text-[#9aa19c] focus:outline-none focus:border-[#52b788] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addingTx}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#2d6a4f] hover:bg-[#23543e] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      {addingTx ? "Saving..." : "Log Transaction"}
                    </button>
                  </form>
                </div>

                {/* 50 / 30 / 20 Health Split */}
                <div className="rounded-2xl border border-[#e2dfd7] bg-white p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-[#1f2421] text-sm">
                      50 / 30 / 20 Cashflow Split
                    </h2>
                    <span className="text-xs text-[#4a524d]">
                      Projected Save:{" "}
                      <strong className="text-[#2d6a4f] font-mono">
                        {formatMoney(summary.projectedSavings, currency)}
                      </strong>
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-[#efece6] overflow-hidden flex border border-[#e2dfd7]">
                    <div
                      className="bg-[#52b788] h-full"
                      style={{ width: `${Math.min(100, needPct)}%` }}
                      title={`Needs ${needPct}%`}
                    />
                    <div
                      className="bg-[#d4a373] h-full"
                      style={{ width: `${Math.min(100, wantPct)}%` }}
                      title={`Wants ${wantPct}%`}
                    />
                    <div
                      className="bg-[#2d6a4f] h-full"
                      style={{ width: `${Math.min(100, savePct)}%` }}
                      title={`Savings ${savePct}%`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-[#f7f6f2] p-2.5 border border-[#e2dfd7]">
                      <span className="text-[#2d6a4f] font-semibold block">
                        Needs ({needPct}%)
                      </span>
                      <span className="text-[#1f2421] font-mono">
                        {formatMoney(summary.bucketTotals.need, currency)}
                      </span>
                      <span className="text-[10px] text-[#737b75] block">Target ≤ 50%</span>
                    </div>
                    <div className="rounded-xl bg-[#f7f6f2] p-2.5 border border-[#e2dfd7]">
                      <span className="text-[#92400e] font-semibold block">
                        Wants ({wantPct}%)
                      </span>
                      <span className="text-[#1f2421] font-mono">
                        {formatMoney(summary.bucketTotals.want, currency)}
                      </span>
                      <span className="text-[10px] text-[#737b75] block">Target ≤ 30%</span>
                    </div>
                    <div className="rounded-xl bg-[#f7f6f2] p-2.5 border border-[#e2dfd7]">
                      <span className="text-[#1b4332] font-semibold block">
                        Savings ({savePct}%)
                      </span>
                      <span className="text-[#1f2421] font-mono">
                        {formatMoney(summary.bucketTotals.saving, currency)}
                      </span>
                      <span className="text-[10px] text-[#737b75] block">Target ≥ 20%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Category Budgets + Pending Bills Alert + Transactions */}
              <div className="lg:col-span-7 space-y-5">
                {summary.pendingBills.length > 0 && (
                  <div className="rounded-2xl border border-[#fde68a] bg-[#fef9e7] p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#78350f]">
                      <strong className="text-[#92400e]">
                        {summary.pendingBills.length} unpaid fixed bill(s)
                      </strong>{" "}
                      ({formatMoney(summary.pendingBillsTotal, currency)}) already reserved from
                      your Safe-to-Spend.
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPendingBills}
                      className="text-xs font-semibold bg-[#1f2421] hover:bg-[#323a35] text-white px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Log All Unpaid Bills
                    </button>
                  </div>
                )}

                {/* Category Limits */}
                <div className="rounded-2xl border border-[#e2dfd7] bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-[#1f2421] text-base">
                      Category Budgets
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("bills")}
                      className="inline-flex items-center gap-1 text-xs text-[#4a524d] hover:text-[#1f2421] cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Edit Limits
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.categories.map((cat) => {
                      const spent = summary.categorySpend[cat.id] || 0;
                      const limit = Math.max(0, Number(cat.monthly_limit) || 0);
                      const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                      const barColor =
                        limit > 0 && spent >= limit
                          ? "bg-[#c94a4a]"
                          : limit > 0 && spent >= limit * 0.8
                          ? "bg-[#d97706]"
                          : "bg-[#52b788]";

                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#1f2421] font-medium flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </span>
                            <span className="font-mono text-[#656d67]">
                              <strong className="text-[#1f2421]">
                                {formatMoney(spent, currency)}
                              </strong>{" "}
                              / {limit > 0 ? formatMoney(limit, currency) : "No cap"}
                            </span>
                          </div>
                          {limit > 0 && (
                            <div className="h-2 rounded-full bg-[#efece6] overflow-hidden border border-[#e2dfd7]">
                              <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transactions List */}
                <div className="rounded-2xl border border-[#e2dfd7] bg-white p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="font-semibold text-[#1f2421] text-base">
                      Cycle Transactions ({filteredTransactions.length})
                    </h2>

                    <div className="flex items-center gap-2">
                      <select
                        value={txFilter}
                        onChange={(e) =>
                          setTxFilter(e.target.value as "all" | "expense" | "income")
                        }
                        className="rounded-lg bg-[#f7f6f2] border border-[#dcd8cf] px-2.5 py-1.5 text-xs text-[#1f2421]"
                      >
                        <option value="all">All</option>
                        <option value="expense">Expenses</option>
                        <option value="income">Income</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f7f6f2] border border-[#dcd8cf] hover:bg-[#efece6] px-2.5 py-1.5 text-xs text-[#1f2421] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <p className="text-xs text-[#737b75] text-center py-8">
                      No transactions logged in this cycle yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {filteredTransactions.map((tx) => {
                        const catName =
                          state.categories.find((c) => c.id === tx.category_id)?.name ||
                          (tx.type === "income" ? "Extra Income" : "General");
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] px-3.5 py-2.5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  tx.type === "income"
                                    ? "bg-[#d8f3dc] text-[#2d6a4f]"
                                    : "bg-[#fdecec] text-[#c94a4a]"
                                }`}
                              >
                                {tx.type === "income" ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-[#1f2421] font-medium truncate">
                                  {tx.description}
                                </p>
                                <p className="text-[11px] text-[#656d67]">
                                  {tx.tx_date} · {catName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`font-mono text-sm font-semibold ${
                                  tx.type === "income" ? "text-[#2d6a4f]" : "text-[#1f2421]"
                                }`}
                              >
                                {tx.type === "income" ? "+" : "-"}
                                {formatMoney(tx.amount, currency)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1.5 text-[#737b75] hover:text-[#c94a4a] cursor-pointer"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "goals" && (
          <GoalsPanel
            goals={state.goals}
            currency={currency}
            monthlySurplusForGoals={summary.monthlySurplusForGoals}
            onAddGoal={handleAddGoal}
            onTopUpGoal={handleTopUpGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === "bills" && (
          <BillsBudgetsPanel
            currency={currency}
            categories={state.categories}
            bills={state.bills}
            pendingBillIds={pendingBillIds}
            onAddBill={handleAddBill}
            onToggleBill={handleToggleBill}
            onDeleteBill={handleDeleteBill}
            onApplyPendingBills={handleApplyPendingBills}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === "loans" && (
          <LoanCalculatorPanel
            currency={currency}
            monthlyIncome={summary.totalIncome}
            existingFixedBills={summary.fixedBillsTotal}
            safeToSpend={summary.safeToSpend}
            categories={state.categories}
            onAddBill={handleAddBill}
            onAddGoal={handleAddGoal}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPanel profile={state.profile} onSave={handleUpdateProfile} />
        )}
      </main>
    </div>
  );
}

function SettingsPanel({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [currency, setCurrency] = useState(profile.currency || "MYR");
  const [cycleDay, setCycleDay] = useState(String(profile.cycle_start_day || 1));
  const [income, setIncome] = useState(String(profile.monthly_income || 0));
  const [savingsTarget, setSavingsTarget] = useState(
    String(profile.monthly_savings_target || 0)
  );
  const [savedNotice, setSavedNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavedNotice(false);
    await onSave({
      full_name: fullName.trim() || null,
      currency,
      cycle_start_day: Math.min(28, Math.max(1, Number(cycleDay) || 1)),
      monthly_income: Math.max(0, Number(income) || 0),
      monthly_savings_target: Math.max(0, Number(savingsTarget) || 0),
      onboarding_completed: true,
    });
    setSavedNotice(true);
  }

  return (
    <div className="max-w-xl rounded-2xl border border-[#e2dfd7] bg-white p-6 shadow-xs">
      <h2 className="font-semibold text-[#1f2421] text-lg mb-1">
        Finance & Cycle Settings
      </h2>
      <p className="text-xs text-[#4a524d] mb-5">
        Adjust your payday cycle date, monthly take-home income, and general savings lock.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#4a524d] mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] focus:outline-none focus:border-[#52b788] focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#4a524d] mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] focus:outline-none focus:border-[#52b788] focus:bg-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a524d] mb-1">
              Payday / Cycle Start Day (1–28)
            </label>
            <input
              type="number"
              min={1}
              max={28}
              value={cycleDay}
              onChange={(e) => setCycleDay(e.target.value)}
              className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] focus:outline-none focus:border-[#52b788] focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#4a524d] mb-1">
              Base Monthly Income ({currency})
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a524d] mb-1">
              General Monthly Savings Target ({currency})
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className="w-full rounded-xl bg-[#f7f6f2] border border-[#dcd8cf] px-3.5 py-2.5 text-sm text-[#1f2421] font-mono focus:outline-none focus:border-[#52b788] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#2d6a4f] hover:bg-[#23543e] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Save Settings
          </button>
          {savedNotice && (
            <span className="text-xs font-medium text-[#2d6a4f]">Settings saved!</span>
          )}
        </div>
      </form>
    </div>
  );
}
