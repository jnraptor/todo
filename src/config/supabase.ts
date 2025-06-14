import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DeviceService } from '../services/deviceService';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// Function to create a client with current device ID
const createSupabaseClient = (): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-device-id': DeviceService.getDeviceId()
        // Note: Real IP headers are handled by nginx/Cloudflare at infrastructure level
        // Client-side apps cannot access real IP addresses for security reasons
      }
    }
  });
};

// Create the main client instance
export const supabase = createSupabaseClient();

// Function to get a fresh client with updated headers (for cases where device ID might change)
export const getSupabaseClient = (): SupabaseClient => {
  return createSupabaseClient();
};