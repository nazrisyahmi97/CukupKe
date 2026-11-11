import type {
  BucketType,
  Category,
  FinanceState,
  RecurringBill,
  SavingsGoal,
  Transaction,
} from "./types";

export const CURRENCIES = [
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit (RM)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (S$)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah (Rp)" },
] as const;

export function formatMoney(amount: number, currency = "MYR"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "IDR" ? 0 : 2,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export interface CycleRange {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  label: string;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
}

/**
 * Computes the billing/payday cycle containing `today` shifted by `cycleOffset` months.
 * Example: cycleStartDay = 25 -> 25 Oct to 24 Nov.
 */
export function getCycleRange(
  cycleStartDay = 1,
  cycleOffset = 0,
  referenceDate = new Date()
): CycleRange {
  const safeDay = Math.min(28, Math.max(1, Math.floor(cycleStartDay)));
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const baseYear = ref.getFullYear();
  let baseMonth = ref.getMonth();

  if (ref.getDate() < safeDay) {
    baseMonth -= 1;
  }
  baseMonth += cycleOffset;

  const start = new Date(baseYear, baseMonth, safeDay);
  const nextStart = new Date(start.getFullYear(), start.getMonth() + 1, safeDay);
  const end = new Date(
    nextStart.getFullYear(),
    nextStart.getMonth(),
    nextStart.getDate() - 1
  );

  const msPerDay = 86_400_000;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);

  let daysElapsed = totalDays;
  let daysRemaining = 0;

  if (ref < start) {
    daysElapsed = 0;
    daysRemaining = totalDays;
  } else if (ref <= end) {
    daysElapsed = Math.round((ref.getTime() - start.getTime()) / msPerDay) + 1;
    daysRemaining = Math.max(1, totalDays - daysElapsed + 1);
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const label =
    safeDay === 1
      ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(start)
      : `${fmt.format(start)} – ${fmt.format(end)}`;

  return {
    start,
    end,
    startIso: toIsoDate(start),
    endIso: toIsoDate(end),
    label,
    totalDays,
    daysElapsed,
    daysRemaining,
  };
}

export interface GoalPlan {
  remaining: number;
  progressPct: number;
  requiredMonthly: number;
  requiredWeekly: number;
  requiredDaily: number;
  monthsNeeded: number;
  estimatedDateIso: string | null;
  statusLabel: "Ready to Buy!" | "Paused" | "Overdue" | "Tight Budget" | "On Track";
  isTightBudget: boolean;
}

export function calculateGoalPlan(
  goal: Pick<
    SavingsGoal,
    "target_amount" | "saved_amount" | "mode" | "target_date" | "monthly_contribution" | "status"
  >,
  monthlySurplus: number,
  today = new Date()
): GoalPlan {
  const target = Math.max(1, Number(goal.target_amount) || 0);
  const saved = Math.max(0, Number(goal.saved_amount) || 0);
  const remaining = Math.max(0, target - saved);
  const progressPct = Math.min(100, Math.round((saved / target) * 100));

  if (remaining === 0 || goal.status === "completed") {
    return {
      remaining: 0,
      progressPct: 100,
      requiredMonthly: 0,
      requiredWeekly: 0,
      requiredDaily: 0,
      monthsNeeded: 0,
      estimatedDateIso: toIsoDate(today),
      statusLabel: "Ready to Buy!",
      isTightBudget: false,
    };
  }

  if (goal.status === "paused") {
    return {
      remaining,
      progressPct,
      requiredMonthly: 0,
      requiredWeekly: 0,
      requiredDaily: 0,
      monthsNeeded: 0,
      estimatedDateIso: goal.target_date,
      statusLabel: "Paused",
      isTightBudget: false,
    };
  }

  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (goal.mode === "by_monthly") {
    const monthly = Math.max(1, Number(goal.monthly_contribution) || 0);
    const monthsNeeded = Math.ceil(remaining / monthly);
    const eta = new Date(ref.getFullYear(), ref.getMonth() + monthsNeeded, ref.getDate());
    const isTight = monthly > Math.max(0, monthlySurplus);
    return {
      remaining,
      progressPct,
      requiredMonthly: monthly,
      requiredWeekly: monthly / 4.33,
      requiredDaily: monthly / 30,
      monthsNeeded,
      estimatedDateIso: toIsoDate(eta),
      statusLabel: isTight ? "Tight Budget" : "On Track",
      isTightBudget: isTight,
    };
  }

  // mode === 'by_date'
  const targetDate = goal.target_date ? parseIsoDate(goal.target_date) : new Date(ref.getFullYear(), ref.getMonth() + 6, ref.getDate());
  const msPerDay = 86_400_000;
  const daysLeft = Math.max(1, Math.ceil((targetDate.getTime() - ref.getTime()) / msPerDay));
  const isOverdue = targetDate < ref;
  const monthsLeft = Math.max(1, daysLeft / 30.4375);
  const weeksLeft = Math.max(1, daysLeft / 7);

  const requiredMonthly = remaining / monthsLeft;
  const requiredWeekly = remaining / weeksLeft;
  const requiredDaily = remaining / daysLeft;
  const isTight = requiredMonthly > Math.max(0, monthlySurplus);

  return {
    remaining,
    progressPct,
    requiredMonthly,
    requiredWeekly,
    requiredDaily,
    monthsNeeded: Math.ceil(monthsLeft),
    estimatedDateIso: toIsoDate(targetDate),
    statusLabel: isOverdue ? "Overdue" : isTight ? "Tight Budget" : "On Track",
    isTightBudget: isTight,
  };
}

export interface CycleSummary {
  cycle: CycleRange;
  cycleTransactions: Transaction[];
  baseIncome: number;
  extraIncome: number;
  totalIncome: number;
  totalSpent: number;
  fixedBillsTotal: number;
  pendingBills: RecurringBill[];
  pendingBillsTotal: number;
  generalSavingsTarget: number;
  goalReservedMonthly: number;
  totalLockedSavings: number;
  safeToSpend: number;
  dailyAllowance: number;
  projectedSavings: number;
  monthlySurplusForGoals: number;
  categorySpend: Record<string, number>;
  bucketTotals: Record<BucketType, number>;
}

export function computeCycleSummary(
  state: FinanceState,
  cycleOffset = 0,
  referenceDate = new Date()
): CycleSummary {
  const cycle = getCycleRange(state.profile.cycle_start_day, cycleOffset, referenceDate);

  const cycleTransactions = state.transactions.filter(
    (tx) => tx.tx_date >= cycle.startIso && tx.tx_date <= cycle.endIso
  );

  const baseIncome = Math.max(0, Number(state.profile.monthly_income) || 0);
  const extraIncome = cycleTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalIncome = baseIncome + extraIncome;

  const expenseTxs = cycleTransactions.filter((tx) => tx.type === "expense");
  const totalSpent = expenseTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const loggedBillIds = new Set(
    expenseTxs.map((tx) => tx.bill_id).filter((id): id is string => Boolean(id))
  );

  const activeBills = state.bills.filter((b) => b.is_active);
  const fixedBillsTotal = activeBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const pendingBills = activeBills.filter((b) => !loggedBillIds.has(b.id));
  const pendingBillsTotal = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);

  const generalSavingsTarget = Math.max(0, Number(state.profile.monthly_savings_target) || 0);

  // Surplus available before locking optional goals
  const monthlySurplusForGoals = Math.max(0, totalIncome - fixedBillsTotal);

  const goalReservedMonthly = state.goals
    .filter((g) => g.status === "active" && g.reserve_in_budget && g.saved_amount < g.target_amount)
    .reduce((sum, g) => sum + calculateGoalPlan(g, monthlySurplusForGoals, referenceDate).requiredMonthly, 0);

  const totalLockedSavings = generalSavingsTarget + goalReservedMonthly;
  const safeToSpend = totalIncome - totalLockedSavings - pendingBillsTotal - totalSpent;
  const dailyAllowance =
    cycle.daysRemaining > 0 ? Math.max(0, safeToSpend) / cycle.daysRemaining : 0;
  const projectedSavings = totalIncome - totalSpent - pendingBillsTotal;

  const categorySpend: Record<string, number> = {};
  const categoryBucketMap = new Map<string, BucketType>();
  for (const cat of state.categories) {
    categoryBucketMap.set(cat.id, cat.bucket);
  }

  const bucketTotals: Record<BucketType, number> = {
    need: 0,
    want: 0,
    saving: Math.max(0, projectedSavings),
  };

  for (const tx of expenseTxs) {
    if (tx.category_id) {
      categorySpend[tx.category_id] = (categorySpend[tx.category_id] || 0) + Number(tx.amount);
      const bucket = categoryBucketMap.get(tx.category_id) || "want";
      if (bucket !== "saving") {
        bucketTotals[bucket] += Number(tx.amount);
      }
    } else {
      bucketTotals.want += Number(tx.amount);
    }
  }

  return {
    cycle,
    cycleTransactions,
    baseIncome,
    extraIncome,
    totalIncome,
    totalSpent,
    fixedBillsTotal,
    pendingBills,
    pendingBillsTotal,
    generalSavingsTarget,
    goalReservedMonthly,
    totalLockedSavings,
    safeToSpend,
    dailyAllowance,
    projectedSavings,
    monthlySurplusForGoals,
    categorySpend,
    bucketTotals,
  };
}

export const DEFAULT_CATEGORY_TEMPLATES: Array<Omit<Category, "id" | "user_id">> = [
  { name: "Housing & Utilities", bucket: "need", monthly_limit: 1200, color: "#4f6d7a", is_default: true },
  { name: "Food & Groceries", bucket: "need", monthly_limit: 700, color: "#52b788", is_default: true },
  { name: "Transport & Fuel", bucket: "need", monthly_limit: 400, color: "#2d6a4f", is_default: true },
  { name: "Dining & Coffee", bucket: "want", monthly_limit: 350, color: "#d4a373", is_default: true },
  { name: "Shopping & Leisure", bucket: "want", monthly_limit: 300, color: "#c97a63", is_default: true },
  { name: "Subscriptions", bucket: "want", monthly_limit: 120, color: "#7c6a96", is_default: true },
];
