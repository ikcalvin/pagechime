import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
}

// Using Service Role key for backend access (Bypassing RLS if we wanted, but Supabase RLS is disabled per specs)
export const supabase = createClient(supabaseUrl, supabaseKey);
