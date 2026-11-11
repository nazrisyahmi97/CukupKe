# CukupKe — Monthly Savings & Finance Control

A personal monthly savings and finance control web app built on the **100% free stack** (Next.js + Tailwind CSS + Supabase PostgreSQL + Vercel Hobby).

## Key Features
- **Safe-to-Spend & Daily Allowance**: Automatically deducts your monthly savings target and unpaid fixed bills upfront (`Income − Locked Savings − Pending Bills − Spent`).
- **Wishlist & Savings Goal Planner**: Add what you want to buy, choose either a **Target Date** ("how much per month/week/day?") or a **Monthly Budget** ("when can I afford it?"), check feasibility against your surplus, and top up anytime.
- **Custom Payday Cycle**: Track calendar months (`1st`) or your actual salary date (e.g. `25th – 24th`).
- **1-Click Recurring Bills**: Save fixed monthly commitments once and log unpaid bills into the current cycle with one click.
- **Malaysia Loan & DSR Calculator**: Calculate Housing (reducing balance, max 35 yrs), Car Hire Purchase (flat rate, max 9 yrs), and Personal loans (max 10 yrs) with Malaysia Debt Service Ratio (DSR) checks.
- **50 / 30 / 20 Cashflow Split & Category Caps**: Color-coded progress bars (`Green`, `Amber` ≥ 80%, `Red` ≥ 100%) + CSV export.
- **Free Auth**: Google Sign-In + Email/Password + Magic Link (works with Gmail, iCloud, or any email) protected by Supabase Row Level Security (RLS).
- **Interactive Demo Mode**: Preview the full app immediately in your browser before connecting Supabase.

---

## Local Development

### 1. Install & Run Immediately (Demo Mode)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and click **Preview Interactive Demo**.

### 2. Connect Supabase & Google Sign-In (Free Tier)
1. Create a free project in [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** in Supabase and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and fill in your Supabase URL & Anon Key:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. *(For Google Sign-In)*:
   - In **Google Cloud Console → APIs & Services → Credentials**, create an **OAuth 2.0 Client ID** (Web application).
   - Add Supabase's callback URL (`https://<your-project-ref>.supabase.co/auth/v1/callback`) as an Authorized Redirect URI.
   - Paste the Google Client ID & Secret into **Supabase → Authentication → Providers → Google**.
   - Under **Supabase → Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your Vercel URL) to Redirect URLs.
