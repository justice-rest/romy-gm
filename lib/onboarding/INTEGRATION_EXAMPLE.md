# Onboarding Data LLM Integration Example

This file shows how to integrate onboarding data into your LLM conversations.

## Quick Integration

### Method 1: Add to System Prompt (Recommended)

Modify `/app/api/chat/route.ts` to include user context in the system prompt:

```typescript
import { getOnboardingContextForLLM } from "@/lib/onboarding/api"

// Inside POST function, after line 97 (before creating effectiveSystemPrompt)
const userContext = await getOnboardingContextForLLM(userId)

const effectiveSystemPrompt = `${systemPrompt || SYSTEM_PROMPT_DEFAULT}

${userContext ? userContext : ""}`.trim()
```

### Method 2: Add as First Message

Alternatively, prepend user context as a system message:

```typescript
import { getOnboardingContextForLLM } from "@/lib/onboarding/api"

// After line 62 (before processing messages)
const userContext = await getOnboardingContextForLLM(userId)

const messagesWithContext = userContext
  ? [
      {
        role: "system",
        content: userContext,
      },
      ...messages,
    ]
  : messages

// Then use messagesWithContext instead of messages in streamText()
```

## Full Example Integration

Here's a complete example of modifying the chat route:

```typescript
// /app/api/chat/route.ts

import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import { createExaSearchTool } from "@/lib/tools"
import { getOnboardingContextForLLM } from "@/lib/onboarding/api" // ADD THIS
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import { Attachment } from "@ai-sdk/ui-utils"
import { Message as MessageAISDK, streamText, ToolSet } from "ai"
import {
  incrementMessageCount,
  logUserMessage,
  storeAssistantMessage,
  validateAndTrackUsage,
} from "./api"
import { createErrorResponse, extractErrorMessage } from "./utils"

export const maxDuration = 60

// ... (existing types)

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      enableSearch,
      message_group_id,
      editCutoffTimestamp,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })

    // ... (existing validation code)

    // 🆕 FETCH ONBOARDING CONTEXT
    const userContext = isAuthenticated
      ? await getOnboardingContextForLLM(userId)
      : ""

    // 🆕 APPEND USER CONTEXT TO SYSTEM PROMPT
    const baseSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT
    const effectiveSystemPrompt = userContext
      ? `${baseSystemPrompt}

${userContext}

Please use the user context above to personalize your responses and provide more relevant fundraising advice.`
      : baseSystemPrompt

    // ... (rest of the code continues as normal)
  } catch (error) {
    // ... (error handling)
  }
}
```

## Example Prompts with Context

### Without Onboarding Context

**User:** "How do I identify major donors?"

**LLM:** "Here are some general strategies for identifying major donors:
1. Look at giving history
2. Research wealth indicators
3. Use screening tools
..."

### With Onboarding Context

**User:** "How do I identify major donors?"

**LLM (with context):** "Hi Sarah! Given that Animal Rescue Foundation has 1,000-5,000 donors in your database and an annual budget of $500K-$1M, here are some tailored strategies:

Since you mentioned you've used WealthEngine and iWave before, I'll focus on maximizing those insights:

1. **Segment your existing donors** - With your database size, start by identifying donors who've given $250+ in the past year
2. **Look for animal welfare passion signals** - In your sector, major donors often have personal connections to animal causes
3. **Budget-appropriate targets** - For your budget range, focus on prospects capable of $10K-$50K gifts
..."

Much more personalized!

## Conditional Personalization

You can also use the onboarding data directly for conditional logic:

```typescript
import { getOnboardingData } from "@/lib/onboarding/api"

const onboardingData = await getOnboardingData(userId)

// Customize behavior based on user data
if (onboardingData?.nonprofit_sector === "Animal Welfare") {
  // Add animal welfare specific tools or prompts
}

if (onboardingData?.prior_tools?.includes("None")) {
  // Provide more educational content for beginners
}

if (onboardingData?.annual_budget?.includes("Under $100K")) {
  // Focus on cost-effective strategies
}
```

## Testing the Integration

1. **Complete onboarding as a test user**
2. **Start a new chat**
3. **Ask a question like:** "What should I focus on?"
4. **Verify the response** includes personalized details from your onboarding

You can also check the actual prompt being sent:

```typescript
// Add this temporarily for debugging
console.log("Effective System Prompt:", effectiveSystemPrompt)
```

## Best Practices

### ✅ Do

- Cache onboarding data per request (don't fetch multiple times)
- Handle null/missing data gracefully
- Keep context concise to save tokens
- Update context when onboarding data changes

### ❌ Don't

- Include sensitive PII in prompts without user consent
- Fetch onboarding data on every message (cache it per session)
- Make the context too verbose (wastes tokens)
- Assume all users have completed onboarding

## Performance Optimization

For high-traffic applications, consider caching:

```typescript
import { unstable_cache } from "next/cache"

const getCachedOnboardingContext = unstable_cache(
  async (userId: string) => {
    return await getOnboardingContextForLLM(userId)
  },
  ["onboarding-context"],
  {
    revalidate: 3600, // 1 hour
    tags: [(userId: string) => `onboarding-${userId}`],
  }
)

// Usage
const userContext = await getCachedOnboardingContext(userId)
```

Then invalidate on update:

```typescript
// In /app/api/onboarding/route.ts POST handler
import { revalidateTag } from "next/cache"

// After successful save
revalidateTag(`onboarding-${user.id}`)
```

## Alternative: Client-Side Context

If you prefer to send context from the client:

```typescript
// In your chat component
const { data: onboardingData } = await fetch("/api/onboarding")

const messagesWithContext = [
  {
    role: "system",
    content: formatOnboardingContextForLLM(onboardingData),
  },
  ...messages,
]

// Send messagesWithContext to /api/chat
```

This approach gives you more control but increases client bundle size.

## Monitoring & Analytics

Track how onboarding data affects conversations:

```typescript
// Add to your analytics
analytics.track("chat_with_context", {
  userId,
  hasOnboardingData: !!userContext,
  sector: onboardingData?.nonprofit_sector,
  hasExperience: onboardingData?.prior_tools?.some((t) => t !== "None"),
})
```

## User Privacy

Remember to:

1. Update your **Privacy Policy** to mention data usage in LLM prompts
2. Allow users to **edit or delete** their onboarding data
3. Consider adding an **opt-out** for context inclusion
4. **Never log** raw onboarding data in external analytics

## Next Steps

1. Apply one of the integration methods above
2. Test with multiple user personas
3. Monitor token usage (context adds ~100-200 tokens)
4. Gather user feedback on personalization quality
5. Iterate on the context format for best results

---

For questions or issues, refer to [ONBOARDING_SETUP.md](../ONBOARDING_SETUP.md)
