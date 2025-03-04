import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(
    url, key
);
