import { toIsoDate } from "./finance";
import type { FinanceState } from "./types";

export function createDemoState(now = new Date()): FinanceState {
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDay = Math.min(now.getDate(), 28);

  const dayIso = (day: number) =>
    toIsoDate(new Date(year, month, Math.min(day, todayDay)));

  const plusMonthsIso = (monthsAhead: number) =>
    toIsoDate(new Date(year, month + monthsAhead, 15));

  return {
    profile: {
      id: "demo-user",
      full_name: "Demo Account",
      currency: "MYR",
      cycle_start_day: 1,
      monthly_income: 4800,
      monthly_savings_target: 700,
      onboarding_completed: true,
    },
    categories: [
      { id: "cat-housing", name: "Housing & Utilities", bucket: "need", monthly_limit: 1200, color: "#4f6d7a", is_default: true },
      { id: "cat-food", name: "Food & Groceries", bucket: "need", monthly_limit: 750, color: "#52b788", is_default: true },
      { id: "cat-transport", name: "Transport & Fuel", bucket: "need", monthly_limit: 400, color: "#2d6a4f", is_default: true },
      { id: "cat-dining", name: "Dining & Coffee", bucket: "want", monthly_limit: 350, color: "#d4a373", is_default: true },
      { id: "cat-shopping", name: "Shopping & Leisure", bucket: "want", monthly_limit: 300, color: "#c97a63", is_default: true },
      { id: "cat-subs", name: "Subscriptions", bucket: "want", monthly_limit: 120, color: "#7c6a96", is_default: true },
    ],
    bills: [
      { id: "bill-rent", name: "House / Room Rent", amount: 950, category_id: "cat-housing", due_day: 1, is_active: true },
      { id: "bill-internet", name: "Fiber Internet + Phone", amount: 159, category_id: "cat-housing", due_day: 5, is_active: true },
      { id: "bill-music", name: "Streaming & Cloud", amount: 45, category_id: "cat-subs", due_day: 10, is_active: true },
    ],
    transactions: [
      {
        id: "tx-1",
        type: "expense",
        amount: 950,
        category_id: "cat-housing",
        description: "House / Room Rent",
        tx_date: dayIso(1),
        bill_id: "bill-rent",
      },
      {
        id: "tx-2",
        type: "expense",
        amount: 215.5,
        category_id: "cat-food",
        description: "Weekly groceries",
        tx_date: dayIso(3),
      },
      {
        id: "tx-3",
        type: "expense",
        amount: 85,
        category_id: "cat-transport",
        description: "Petrol + Touch 'n Go top-up",
        tx_date: dayIso(4),
      },
      {
        id: "tx-4",
        type: "expense",
        amount: 42.8,
        category_id: "cat-dining",
        description: "Weekend coffee & lunch",
        tx_date: dayIso(6),
      },
      {
        id: "tx-5",
        type: "income",
        amount: 350,
        category_id: null,
        description: "Freelance side gig",
        tx_date: dayIso(7),
      },
    ],
    goals: [
      {
        id: "goal-laptop",
        name: "MacBook / New Work Laptop",
        target_amount: 4800,
        saved_amount: 1600,
        mode: "by_date",
        target_date: plusMonthsIso(8),
        monthly_contribution: null,
        reserve_in_budget: true,
        status: "active",
      },
      {
        id: "goal-trip",
        name: "Japan Autumn Trip",
        target_amount: 6000,
        saved_amount: 1200,
        mode: "by_monthly",
        target_date: null,
        monthly_contribution: 350,
        reserve_in_budget: false,
        status: "active",
      },
      {
        id: "goal-emergency",
        name: "Emergency Fund (3 Months)",
        target_amount: 9000,
        saved_amount: 4500,
        mode: "by_monthly",
        target_date: null,
        monthly_contribution: 500,
        reserve_in_budget: false,
        status: "active",
      },
    ],
  };
}
