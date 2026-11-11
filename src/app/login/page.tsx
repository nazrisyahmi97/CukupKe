import { Suspense } from "react";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { LoginClient } from "./login-client";

export default function LoginPage() {
  const { isConfigured } = getSupabaseConfig();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
          Loading sign-in...
        </div>
      }
    >
      <LoginClient supabaseConfigured={isConfigured} />
    </Suspense>
  );
}
