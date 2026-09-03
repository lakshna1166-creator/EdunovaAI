import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("❌ CRITICAL ERROR: SUPABASE_URL or SUPABASE_SECRET_KEY is missing from environment variables.");
  console.error("Please ensure your .env file is properly configured with valid Supabase credentials.");
}

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseSecretKey || "placeholder_secret_key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export default supabase;

