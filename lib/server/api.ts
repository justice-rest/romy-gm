import { createClient } from "@/lib/supabase/server"
import { isSupabaseEnabled } from "../supabase/config"
import type { SupabaseClientType } from "@/app/types/api.types"

/**
 * Validates the user's identity
 * @param userId - The ID of the user.
 * @returns The Supabase client.
 */
export async function validateUserIdentity(
  userId: string
): Promise<SupabaseClientType | null> {
  if (!isSupabaseEnabled) {
    return null
  }

  const supabase = await createClient()

  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user?.id) {
    throw new Error("Unable to get authenticated user")
  }

  if (authData.user.id !== userId) {
    throw new Error("User ID does not match authenticated user")
  }

  return supabase
}
