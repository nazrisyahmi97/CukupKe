export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    !url.includes("your-project-id") &&
    !anonKey.includes("your-anon-key");

  return { url, anonKey, isConfigured };
}
