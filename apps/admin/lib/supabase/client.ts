"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  supabaseClient = createBrowserSupabaseClient();

  return supabaseClient;
}

export async function ensureSupabaseSession() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const current = await supabase.auth.getSession();
  return current.data.session ?? null;
}

export async function getAccessToken() {
  const session = await ensureSupabaseSession();
  return session?.access_token ?? "";
}
