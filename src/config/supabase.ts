import { createClient } from '@supabase/supabase-js';
import { DeviceService } from '../services/deviceService';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// Create client with custom headers for device ID
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-device-id': DeviceService.getDeviceId()
    }
  }
});

// Function to create a new client with updated headers
export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-device-id': DeviceService.hasDeviceId() ? DeviceService.getDeviceId() : ''
      }
    }
  });
};