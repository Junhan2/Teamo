import { supabase } from '@/lib/auth/supabase'

export function createClient() {
  return supabase
}