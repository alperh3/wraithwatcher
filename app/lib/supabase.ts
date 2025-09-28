import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types
export interface DatabaseSighting {
  id?: number
  date: string
  time: string
  type: string
  location: string
  state: string
  notes: string
  lat: number
  lng: number
  image_url?: string
  created_at?: string
  updated_at?: string
}
