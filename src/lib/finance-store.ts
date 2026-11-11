import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORY_TEMPLATES } from "./finance";
import type {
  Category,
  FinanceState,
  RecurringBill,
  SavingsGoal,
  Transaction,
  UserProfile,
} from "./types";

const DEMO_STORAGE_KEY = "cukupke_demo_state_v1";

export function loadDemoFromStorage(fallback: () => FinanceState): FinanceState {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const initial = fallback();
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as FinanceState;
  } catch {
    return fallback();
  }
}

export function saveDemoToStorage(state: FinanceState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetDemoStorage(fallback: () => FinanceState): FinanceState {
  const initial = fallback();
  saveDemoToStorage(initial);
  return initial;
}

/**
 * Loads all finance tables for an authenticated Supabase user,
 * automatically provisioning a profile & default categories on first login.
 */
export async function loadSupabaseFinanceState(
  supabase: SupabaseClient,
  userId: string,
  userFullName: string | null
): Promise<FinanceState> {
  // 1. Ensure profile exists
  const { data: existingProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    throw new Error(profileErr.message);
  }

  let profile: UserProfile;
  if (!existingProfile) {
    const newProfile: UserProfile = {
      id: userId,
      full_name: userFullName,
      currency: "MYR",
      cycle_start_day: 1,
      monthly_income: 0,
      monthly_savings_target: 0,
      onboarding_completed: false,
    };
    const { data: inserted, error: insertErr } = await supabase
      .from("profiles")
      .insert(newProfile)
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);
    profile = inserted as UserProfile;
  } else {
    profile = existingProfile as UserProfile;
  }

  // 2. Load categories (seed defaults if empty)
  const { data: catsData, error: catsErr } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (catsErr) throw new Error(catsErr.message);

  let categories = (catsData ?? []) as Category[];
  if (categories.length === 0) {
    const seedRows = DEFAULT_CATEGORY_TEMPLATES.map((t) => ({
      ...t,
      user_id: userId,
    }));
    const { data: seeded, error: seedErr } = await supabase
      .from("categories")
      .insert(seedRows)
      .select();
    if (seedErr) throw new Error(seedErr.message);
    categories = (seeded ?? []) as Category[];
  }

  // 3. Load bills, transactions, and goals in parallel
  const [billsRes, txRes, goalsRes] = await Promise.all([
    supabase
      .from("recurring_bills")
      .select("*")
      .eq("user_id", userId)
      .order("due_day", { ascending: true }),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (billsRes.error) throw new Error(billsRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);
  if (goalsRes.error) throw new Error(goalsRes.error.message);

  return {
    profile,
    categories,
    bills: (billsRes.data ?? []) as RecurringBill[],
    transactions: (txRes.data ?? []) as Transaction[],
    goals: (goalsRes.data ?? []) as SavingsGoal[],
  };
}
