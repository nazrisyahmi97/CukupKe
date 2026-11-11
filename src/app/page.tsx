import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-tight text-lg text-white">
              Cukup<span className="text-emerald-400">Ke</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard?demo=1"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Live Demo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free Stack · Next.js + Supabase + Google Auth
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">
            Know your exact{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Safe-to-Spend
            </span>{" "}
            before you spend.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Lock in your monthly savings first, track fixed bills with one click, and calculate
            exactly how much to save each day or month to buy the things you want.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/dashboard?demo=1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Preview Interactive Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              Sign In with Google / Email
            </Link>
          </div>

          {/* Mini Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-2xl text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-950/70 border border-emerald-500/25 p-4">
                <p className="text-xs uppercase tracking-wider text-emerald-400 font-medium">
                  Safe-to-Spend
                </p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">RM 2,163.70</p>
                <p className="text-xs text-slate-400 mt-1">~RM 90.15 / day left in cycle</p>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-wider text-cyan-400 font-medium">
                  Locked Monthly Savings
                </p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">RM 1,100.00</p>
                <p className="text-xs text-slate-400 mt-1">RM 700 general + RM 400 goals</p>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-wider text-amber-400 font-medium">
                  Goal: New Laptop
                </p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">33% Saved</p>
                <p className="text-xs text-slate-400 mt-1">RM 400/mo · Ready in 8 months</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Wallet className="w-5 h-5 text-emerald-400" />}
              title="Pay-Yourself-First Control"
              description="Deducts your savings target and pending fixed bills upfront, leaving your true Safe-to-Spend balance and daily allowance."
            />
            <FeatureCard
              icon={<Target className="w-5 h-5 text-cyan-400" />}
              title="Wishlist & Goal Calculator"
              description="Enter what you want to buy and when you want it—or your monthly budget—and get exact daily, weekly, and monthly savings numbers."
            />
            <FeatureCard
              icon={<CalendarClock className="w-5 h-5 text-violet-400" />}
              title="Custom Payday Cycle"
              description="Track by calendar month (1st) or match your real salary date (e.g. 25th to 24th) with full cycle navigation."
            />
            <FeatureCard
              icon={<Receipt className="w-5 h-5 text-amber-400" />}
              title="1-Click Recurring Bills"
              description="Save rent, internet, car loan, and subscriptions once, then log unpaid bills into your cycle with a single click."
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-5 h-5 text-pink-400" />}
              title="50 / 30 / 20 Health Split"
              description="Categories map to Needs, Wants, and Savings with automatic color alerts when any category passes 80% or 100%."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5 text-sky-400" />}
              title="Free Auth + Row Level Security"
              description="Supports free Google Sign-In and Email/Magic Link (great for iCloud/Apple users) with private per-user PostgreSQL rows."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/70 py-6 text-center text-xs text-slate-500">
        CukupKe · Built with Next.js, Tailwind CSS, and Supabase
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="font-semibold text-white text-base">{title}</h2>
      <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{description}</p>
    </div>
  );
}
