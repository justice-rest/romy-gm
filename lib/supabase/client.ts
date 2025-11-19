import { Database } from "@/app/types/database.types"
import type { SupabaseClientType } from "@/app/types/api.types"
import { createBrowserClient } from "@supabase/ssr"
import { isSupabaseEnabled } from "./config"

export function createClient(): SupabaseClientType | null {
  if (!isSupabaseEnabled) {
    return null
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
