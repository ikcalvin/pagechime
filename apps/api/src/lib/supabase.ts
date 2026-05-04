import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
}

if (!supabaseAnonKey) {
  throw new Error("Missing SUPABASE_ANON_KEY environment variable");
}

/**
 * Admin client using the service role key.
 * Bypasses RLS — use only for auth verification and background jobs (e.g. Inngest).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Creates a per-request Supabase client that forwards the user's JWT,
 * so Row Level Security policies are enforced on every query.
 */
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/** @deprecated Use supabaseAdmin or createUserClient instead. */
export const supabase = supabaseAdmin;
