export type BucketType = "need" | "want" | "saving";
export type TransactionType = "income" | "expense";
export type GoalMode = "by_date" | "by_monthly";
export type GoalStatus = "active" | "paused" | "completed";

export interface UserProfile {
  id: string;
  full_name: string | null;
  currency: string;
  cycle_start_day: number;
  monthly_income: number;
  monthly_savings_target: number;
  onboarding_completed: boolean;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  bucket: BucketType;
  monthly_limit: number;
  color: string;
  is_default?: boolean;
}

export interface RecurringBill {
  id: string;
  user_id?: string;
  name: string;
  amount: number;
  category_id: string | null;
  due_day: number;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  user_id?: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  description: string;
  tx_date: string; // YYYY-MM-DD
  bill_id?: string | null;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  mode: GoalMode;
  target_date: string | null; // YYYY-MM-DD
  monthly_contribution: number | null;
  reserve_in_budget: boolean;
  status: GoalStatus;
  created_at?: string;
}

export interface FinanceState {
  profile: UserProfile;
  categories: Category[];
  bills: RecurringBill[];
  transactions: Transaction[];
  goals: SavingsGoal[];
}
