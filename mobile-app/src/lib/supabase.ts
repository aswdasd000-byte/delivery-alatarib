import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Publishable key only. Never place service_role/secret keys in a mobile app.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://apreejawamptetdflwcf.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_amN_E9EIKrjl_fk-ndm1YA_R7mI24j7";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
