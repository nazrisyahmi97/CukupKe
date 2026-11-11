import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CalendarClock,
  CheckCircle2,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#1f2421]">
      {/* Top Navbar */}
      <header className="border-b border-[#e2dfd7] bg-[#f7f6f2]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d8f3dc] border border-[#b7e4c7] flex items-center justify-center text-[#2d6a4f]">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-tight text-lg text-[#1f2421]">
              Cukup<span className="text-[#2d6a4f]">Ke</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard?demo=1"
              className="text-sm font-medium text-[#4a524d] hover:text-[#1f2421] px-3 py-2 rounded-lg transition-colors"
            >
              Live Demo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#1f2421] hover:bg-[#323a35] text-[#f7f6f2] px-4 py-2 rounded-xl transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f6ec] border border-[#b7e4c7] text-[#2d6a4f] text-xs font-medium mb-6">
            Personal Savings · Budget Control · Malaysia Loan Planner
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1f2421] max-w-3xl mx-auto leading-[1.12]">
            Know your exact{" "}
            <span className="underline decoration-[#74c69d] decoration-4 underline-offset-4 text-[#2d6a4f]">
              Safe-to-Spend
            </span>{" "}
            before you buy.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#4a524d] max-w-2xl mx-auto leading-relaxed">
            Set aside your monthly savings first, track fixed bills in one click, check housing
            or car loan DSR, and plan exactly how much to save for the things you want.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard?demo=1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2d6a4f] hover:bg-[#23543e] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Preview Interactive Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#efece6] border border-[#d6d2c8] text-[#1f2421] font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              Sign In with Google / Email
            </Link>
          </div>

          {/* Clean Snapshot Preview */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-[#e2dfd7] bg-white p-5 sm:p-6 shadow-sm text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-[#e6f6ec] border border-[#b7e4c7] p-4">
                <p className="text-xs uppercase tracking-wider text-[#2d6a4f] font-semibold">
                  Safe-to-Spend
                </p>
                <p className="text-2xl font-bold text-[#1f2421] mt-1 font-mono">
                  RM 2,163.70
                </p>
                <p className="text-xs text-[#4a524d] mt-1">
                  ~RM 90.15 / day left in cycle
                </p>
              </div>
              <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] p-4">
                <p className="text-xs uppercase tracking-wider text-[#4a524d] font-semibold">
                  Locked Monthly Savings
                </p>
                <p className="text-2xl font-bold text-[#1f2421] mt-1 font-mono">
                  RM 1,100.00
                </p>
                <p className="text-xs text-[#656d67] mt-1">
                  RM 700 general + RM 400 goals
                </p>
              </div>
              <div className="rounded-xl bg-[#f7f6f2] border border-[#e2dfd7] p-4">
                <p className="text-xs uppercase tracking-wider text-[#4a524d] font-semibold">
                  Goal: New Laptop
                </p>
                <p className="text-2xl font-bold text-[#2d6a4f] mt-1 font-mono">
                  33% Saved
                </p>
                <p className="text-xs text-[#656d67] mt-1">
                  RM 400/mo · Ready in 8 months
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Wallet className="w-5 h-5 text-[#2d6a4f]" />}
              title="Pay-Yourself-First Control"
              description="Locks your monthly savings target and pending fixed bills upfront, showing your true Safe-to-Spend balance and daily allowance."
            />
            <FeatureCard
              icon={<Target className="w-5 h-5 text-[#2d6a4f]" />}
              title="Wishlist & Goal Calculator"
              description="Enter what you want to buy and when you want it—or your monthly budget—and get exact daily, weekly, and monthly savings targets."
            />
            <FeatureCard
              icon={<Calculator className="w-5 h-5 text-[#2d6a4f]" />}
              title="Malaysia Loan & DSR Check"
              description="Calculate Housing (reducing balance), Car Hire Purchase (flat rate), and Personal loans with instant Malaysia DSR impact."
            />
            <FeatureCard
              icon={<CalendarClock className="w-5 h-5 text-[#2d6a4f]" />}
              title="Custom Payday Cycle"
              description="Track by calendar month (1st) or match your real salary payday (e.g. 25th to 24th) with full cycle switching."
            />
            <FeatureCard
              icon={<Receipt className="w-5 h-5 text-[#2d6a4f]" />}
              title="1-Click Recurring Bills"
              description="Save rent, internet, car loan, and subscriptions once, then log unpaid bills into your cycle with a single click."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5 text-[#2d6a4f]" />}
              title="Private Cloud Sync + CSV"
              description="Sign in with Google or Email/Magic Link. Protected with Supabase Row Level Security and 1-click CSV export."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e2dfd7] bg-[#f7f6f2] py-6 text-center text-xs text-[#656d67] flex items-center justify-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#52b788]" />
        <span>CukupKe · Simple monthly finance & savings control</span>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e2dfd7] bg-white p-5 hover:border-[#c8c3b8] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-[#e6f6ec] border border-[#ccebd7] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="font-semibold text-[#1f2421] text-base">{title}</h2>
      <p className="text-sm text-[#4a524d] mt-1.5 leading-relaxed">{description}</p>
    </div>
  );
}
