import { Chats } from "@/lib/chat-store/types"
import type { UserProfile } from "@/lib/user/types"

interface UseModelProps {
  currentChat: Chats | null
  user: UserProfile | null
  updateChatModel?: (chatId: string, model: string) => Promise<void>
  chatId: string | null
}

/**
 * Hook that returns a hardcoded model (Grok 4 Fast)
 * Model selection has been locked to openrouter:x-ai/grok-4-fast
 * @returns Object containing the locked model and a no-op handler function
 */
export function useModel({
  currentChat,
  user,
  updateChatModel,
  chatId,
}: UseModelProps) {
  // Hardcoded to Grok 4 Fast - model selection is locked
  const selectedModel = "openrouter:x-ai/grok-4-fast"

  // No-op handler - model changes are not allowed
  const handleModelChange = async (newModel: string) => {
    // Model selection is locked - this function does nothing
    return
  }

  return {
    selectedModel,
    handleModelChange,
  }
}
