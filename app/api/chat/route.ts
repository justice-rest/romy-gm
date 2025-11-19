import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import { createExaSearchTool } from "@/lib/tools"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import { getOnboardingContextForLLM } from "@/lib/onboarding/api"
import { getAIMemoryTools, isAIMemoryEnabled } from "@/lib/ai-memory"
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

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  enableSearch: boolean
  message_group_id?: string
  editCutoffTimestamp?: string
}

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

    // Increment message count for successful validation
    if (supabase) {
      await incrementMessageCount({ supabase, userId })
    }

    const userMessage = messages[messages.length - 1]

    // If editing, delete messages from cutoff BEFORE saving the new user message
    if (supabase && editCutoffTimestamp) {
      try {
        await supabase
          .from("messages")
          .delete()
          .eq("chat_id", chatId)
          .gte("created_at", editCutoffTimestamp)
      } catch (err) {
        console.error("Failed to delete messages from cutoff:", err)
      }
    }

    if (supabase && userMessage?.role === "user") {
      console.log("[/api/chat] Saving user message to database:", {
        chatId,
        userId,
        contentLength: userMessage.content.length,
        hasAttachments: !!userMessage.experimental_attachments,
      })
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content: userMessage.content,
        attachments: userMessage.experimental_attachments as Attachment[],
        model,
        isAuthenticated,
        message_group_id,
      })
    } else {
      console.warn("[/api/chat] Skipping user message save:", {
        hasSupabase: !!supabase,
        messageRole: userMessage?.role,
      })
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    // Fetch user's onboarding context for personalization
    const userContext = isAuthenticated
      ? await getOnboardingContextForLLM(userId)
      : ""

    // Append user context to system prompt if available
    const baseSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT
    let effectiveSystemPrompt = userContext
      ? `${baseSystemPrompt}

${userContext}

Use the user context above to personalize your responses and provide more relevant fundraising advice tailored to their organization and experience level.`
      : baseSystemPrompt

    // Add memory capability instructions if AI Memory is enabled
    if (isAIMemoryEnabled() && isAuthenticated) {
      effectiveSystemPrompt += `

## Memory Capabilities

You have access to long-term memory tools that allow you to:
1. **Remember important information** - Use the addMemory tool to save key facts, preferences, or insights from conversations
2. **Recall past conversations** - Use the searchMemories tool to retrieve relevant information from previous chats with semantic understanding

When the user shares important information (preferences, goals, organization details, past experiences, etc.), proactively save it to memory. Before answering questions, search your memory for relevant context that could help you provide more personalized responses.

Always use these memory tools naturally in your conversations to build a continuous relationship with the user across all chat sessions.`
    }

    let apiKey: string | undefined
    if (isAuthenticated && userId) {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(model)
      apiKey =
        (await getEffectiveApiKey(userId, provider as ProviderWithoutOllama)) ||
        undefined
    }

    // Create tools object - add Exa search tool alongside OpenRouter's web search plugin
    let tools: ToolSet = {}

    // Add Exa search tool if EXA_API_KEY is available
    // This provides an additional search capability alongside OpenRouter's plugin
    if (process.env.EXA_API_KEY) {
      tools.exa_search = createExaSearchTool()
    }

    // Add AI Memory tools for cross-chat memory and personalization
    // This allows the AI to remember information from previous conversations
    // using Supabase + pgvector for semantic search
    if (isAIMemoryEnabled() && isAuthenticated && supabase) {
      const aiMemoryTools = getAIMemoryTools(userId, supabase, chatId)
      if (aiMemoryTools) {
        // Spread operator to properly merge tools
        tools = { ...tools, ...aiMemoryTools }
      }
    }

    const result = streamText({
      model: modelConfig.apiSdk(apiKey, { enableSearch }),
      system: effectiveSystemPrompt,
      messages: messages,
      tools: tools,
      maxSteps: 10,
      onError: (err: unknown) => {
        console.error("Streaming error occurred:", err)
        // Don't set streamError anymore - let the AI SDK handle it through the stream
      },

      onFinish: async ({ response }) => {
        if (supabase) {
          await storeAssistantMessage({
            supabase,
            chatId,
            messages:
              response.messages as unknown as import("@/app/types/api.types").Message[],
            message_group_id,
            model,
          })
        }
      },
    })

    return result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
      getErrorMessage: (error: unknown) => {
        console.error("Error forwarded to client:", error)
        return extractErrorMessage(error)
      },
    })
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}
