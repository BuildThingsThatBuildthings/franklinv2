import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

// Initialize the Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

const isValidConfig = supabaseUrl !== 'https://placeholder.supabase.co' && 
                     supabaseAnonKey !== 'placeholder-key' &&
                     supabaseUrl.includes('supabase.co')

if (!isValidConfig) {
  console.warn('⚠️ Supabase not configured. Using mock authentication for development.')
  console.warn('To connect to Supabase:')
  console.warn('1. Create a project at https://app.supabase.com')
  console.warn('2. Update .env with your project URL and anon key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export const isSupabaseConfigured = isValidConfig