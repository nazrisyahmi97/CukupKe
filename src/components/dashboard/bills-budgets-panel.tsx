"use client";

import { useState } from "react";
import { Check, Plus, Receipt, SlidersHorizontal, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/finance";
import type { BucketType, Category, RecurringBill } from "@/lib/types";

const BUCKET_COLORS: Record<BucketType, string> = {
  need: "#10b981",
  want: "#f59e0b",
  saving: "#06b6d4",
};

interface BillsBudgetsPanelProps {
  currency: string;
  categories: Category[];
  bills: RecurringBill[];
  pendingBillIds: Set<string>;
  onAddBill: (bill: Omit<RecurringBill, "id" | "user_id">) => Promise<void>;
  onToggleBill: (billId: string, isActive: boolean) => Promise<void>;
  onDeleteBill: (billId: string) => Promise<void>;
  onApplyPendingBills: () => Promise<void>;
  onAddCategory: (cat: Omit<Category, "id" | "user_id">) => Promise<void>;
  onUpdateCategory: (catId: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (catId: string) => Promise<void>;
}

export function BillsBudgetsPanel({
  currency,
  categories,
  bills,
  pendingBillIds,
  onAddBill,
  onToggleBill,
  onDeleteBill,
  onApplyPendingBills,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: BillsBudgetsPanelProps) {
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDay, setBillDueDay] = useState("1");
  const [billCategoryId, setBillCategoryId] = useState(categories[0]?.id || "");

  const [catName, setCatName] = useState("");
  const [catBucket, setCatBucket] = useState<BucketType>("need");
  const [catLimit, setCatLimit] = useState("300");

  async function handleBillSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(billAmount);
    if (!billName.trim() || !Number.isFinite(amount) || amount < 0) return;

    await onAddBill({
      name: billName.trim(),
      amount,
      category_id: billCategoryId || null,
      due_day: Math.min(28, Math.max(1, Number(billDueDay) || 1)),
      is_active: true,
    });
    setBillName("");
    setBillAmount("");
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    const limit = Number(catLimit) || 0;
    if (!catName.trim()) return;

    await onAddCategory({
      name: catName.trim(),
      bucket: catBucket,
      monthly_limit: Math.max(0, limit),
      color: BUCKET_COLORS[catBucket],
      is_default: false,
    });
    setCatName("");
    setCatLimit("300");
  }

  const pendingCount = bills.filter((b) => b.is_active && pendingBillIds.has(b.id)).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Recurring Bills */}
      <div className="lg:col-span-6 space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                Recurring Fixed Bills
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-reserved from Safe-to-Spend until logged in the current cycle.
              </p>
            </div>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={onApplyPendingBills}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Log {pendingCount} Unpaid
              </button>
            )}
          </div>

          <form onSubmit={handleBillSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-5">
            <input
              type="text"
              required
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              placeholder="Bill name (e.g. Rent)"
              className="sm:col-span-5 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder={`Amount (${currency})`}
              className="sm:col-span-3 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={billCategoryId}
              onChange={(e) => setBillCategoryId(e.target.value)}
              className="sm:col-span-2 rounded-xl bg-slate-950 border border-slate-800 px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2 flex gap-1.5">
              <input
                type="number"
                min={1}
                max={28}
                title="Due day of month"
                value={billDueDay}
                onChange={(e) => setBillDueDay(e.target.value)}
                className="w-12 rounded-xl bg-slate-950 border border-slate-800 px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="space-y-2.5">
            {bills.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No fixed bills yet. Add rent, car loan, internet, or subscriptions above.
              </p>
            ) : (
              bills.map((bill) => {
                const isPending = bill.is_active && pendingBillIds.has(bill.id);
                const catNameLookup =
                  categories.find((c) => c.id === bill.category_id)?.name || "General";

                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium truncate ${
                            bill.is_active ? "text-white" : "text-slate-500 line-through"
                          }`}
                        >
                          {bill.name}
                        </span>
                        {bill.is_active && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              isPending
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {isPending ? "Pending" : "Logged"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Due day {bill.due_day} · {catNameLookup}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-sm font-semibold text-slate-200">
                        {formatMoney(bill.amount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleBill(bill.id, !bill.is_active)}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {bill.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBill(bill.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right: Category Budgets */}
      <div className="lg:col-span-6 space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-white text-base flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              Category Limits & 50/30/20 Buckets
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize monthly spending caps and map each category to Need, Want, or Saving.
            </p>
          </div>

          <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-5">
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="New category"
              className="sm:col-span-5 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={catBucket}
              onChange={(e) => setCatBucket(e.target.value as BucketType)}
              className="sm:col-span-3 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="need">Need</option>
              <option value="want">Want</option>
              <option value="saving">Saving</option>
            </select>
            <input
              type="number"
              min={0}
              step="10"
              value={catLimit}
              onChange={(e) => setCatLimit(e.target.value)}
              placeholder="Limit"
              className="sm:col-span-3 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="sm:col-span-1 inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-2.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-white font-medium truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={cat.bucket}
                    onChange={(e) =>
                      onUpdateCategory(cat.id, { bucket: e.target.value as BucketType })
                    }
                    className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-300"
                  >
                    <option value="need">Need</option>
                    <option value="want">Want</option>
                    <option value="saving">Saving</option>
                  </select>

                  <input
                    type="number"
                    min={0}
                    step="10"
                    defaultValue={cat.monthly_limit}
                    onBlur={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      if (val !== cat.monthly_limit) {
                        onUpdateCategory(cat.id, { monthly_limit: val });
                      }
                    }}
                    className="w-24 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-right font-mono text-white"
                  />

                  <button
                    type="button"
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
