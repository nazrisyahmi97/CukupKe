import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function DashboardLoader({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const isDemoQuery = params.demo === "1";
  const { isConfigured } = getSupabaseConfig();

  if (isDemoQuery) {
    return <DashboardClient mode="demo" />;
  }

  if (!isConfigured) {
    redirect("/dashboard?demo=1");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    null;

  return (
    <DashboardClient
      mode="supabase"
      userId={user.id}
      userEmail={user.email ?? null}
      userFullName={fullName}
    />
  );
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
          Loading dashboard...
        </div>
      }
    >
      <DashboardLoader searchParams={searchParams} />
    </Suspense>
  );
}
