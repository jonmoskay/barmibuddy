import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export interface SupabaseClientOptions {
  url: string;
  anonKey: string;
  /**
   * Optional storage adapter. Pass AsyncStorage on React Native so the auth
   * session persists across app restarts. Leave undefined on web (Supabase
   * defaults to localStorage).
   */
  storage?: {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
  };
  /**
   * React Native should set this to false (no URL detection on mobile).
   * Web/Next.js should leave it undefined (defaults to true).
   */
  detectSessionInUrl?: boolean;
}

export function createSupabaseClient({
  url,
  anonKey,
  storage,
  detectSessionInUrl,
}: SupabaseClientOptions): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey, {
    auth: {
      storage: storage as never,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: detectSessionInUrl ?? true,
    },
  });
}
