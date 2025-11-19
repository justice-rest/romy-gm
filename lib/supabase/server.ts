import { Database } from "@/app/types/database.types"
import type { SupabaseClientType } from "@/app/types/api.types"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSupabaseEnabled } from "./config"

export const createClient = async (): Promise<SupabaseClientType | null> => {
  if (!isSupabaseEnabled) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore for middleware
          }
        },
      },
    }
  )
}
