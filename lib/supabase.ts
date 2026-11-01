import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export type Coupon = Database['public']['Tables']['coupons']['Row']

let client: SupabaseClient<Database> | null = null

function readEnv(serverName: string, publicName: string) {
  const value = process.env[serverName] ?? process.env[publicName]
  if (!value) {
    throw new Error(
      `Missing ${serverName} (or ${publicName}). Set it in .env.local and in the Vercel project.`
    )
  }
  return value
}

/**
 * Server-side Supabase client. Created on first use rather than at import time,
 * so a missing env var fails where it is read instead of crashing the module graph.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(
      readEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
      readEnv('SUPABASE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    )
  }
  return client
}
