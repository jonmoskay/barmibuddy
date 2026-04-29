import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSupabaseClient } from "@barmibuddy/db";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy apps/mobile/.env.example → apps/mobile/.env and fill in values from your Supabase project (Settings → API)."
  );
}

export const supabase = createSupabaseClient({
  url,
  anonKey,
  storage: AsyncStorage,
  detectSessionInUrl: false, // RN doesn't have URLs to detect sessions in
});
