import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/app/types/database.types"

export type OnboardingData = Tables<"onboarding_data">

/**
 * Fetch user's onboarding data
 */
export async function getOnboardingData(
  userId?: string,
): Promise<OnboardingData | null> {
  const supabase = await createClient()

  let targetUserId = userId

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from("onboarding_data")
    .select("*")
    .eq("user_id", targetUserId)
    .single()

  if (error) {
    console.error("Error fetching onboarding data:", error)
    return null
  }

  return data
}

/**
 * Format onboarding data into a human-readable context string for LLM
 */
export function formatOnboardingContextForLLM(
  data: OnboardingData | null,
): string {
  if (!data) {
    return ""
  }

  const parts: string[] = []

  if (data.first_name) {
    parts.push(`User's name: ${data.first_name}`)
  }

  if (data.nonprofit_name) {
    parts.push(`Works with: ${data.nonprofit_name}`)
  }

  if (data.nonprofit_location) {
    parts.push(`Organization location: ${data.nonprofit_location}`)
  }

  if (data.nonprofit_sector) {
    parts.push(`Sector: ${data.nonprofit_sector}`)
  }

  if (data.annual_budget) {
    parts.push(`Annual budget: ${data.annual_budget}`)
  }

  if (data.donor_count) {
    parts.push(`Number of individual donors: ${data.donor_count}`)
  }

  if (data.fundraising_primary !== null) {
    parts.push(
      `Fundraising is ${data.fundraising_primary ? "their primary responsibility" : "not their primary responsibility"}`,
    )
  }

  if (data.prior_tools && data.prior_tools.length > 0) {
    const toolsText =
      data.prior_tools.includes("None") || data.prior_tools[0] === "None"
        ? "No prior experience with donor wealth screening tools"
        : `Previous experience with: ${data.prior_tools.join(", ")}`
    parts.push(toolsText)
  }

  if (data.purpose) {
    parts.push(`Their goal with Rōmy: ${data.purpose}`)
  }

  if (parts.length === 0) {
    return ""
  }

  return `# User Context\n${parts.join("\n")}\n`
}

/**
 * Get formatted onboarding context for current user
 */
export async function getOnboardingContextForLLM(
  userId?: string,
): Promise<string> {
  const data = await getOnboardingData(userId)
  return formatOnboardingContextForLLM(data)
}
