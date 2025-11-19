"use client"

import { toast } from "@/components/ui/toast"
import { useChatSession } from "@/lib/chat-store/session/provider"
import type { Message as MessageAISDK } from "ai"
import { createContext, useContext, useEffect, useState } from "react"
import { writeToIndexedDB } from "../persist"
import {
  cacheMessages,
  clearMessagesForChat,
  getCachedMessages,
  getMessagesFromDb,
  setMessages as saveMessages,
} from "./api"

interface MessagesContextType {
  messages: MessageAISDK[]
  isLoading: boolean
  setMessages: React.Dispatch<React.SetStateAction<MessageAISDK[]>>
  refresh: () => Promise<void>
  saveAllMessages: (messages: MessageAISDK[]) => Promise<void>
  cacheAndAddMessage: (message: MessageAISDK) => Promise<void>
  resetMessages: () => Promise<void>
  deleteMessages: () => Promise<void>
}

const MessagesContext = createContext<MessagesContextType | null>(null)

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context)
    throw new Error("useMessages must be used within MessagesProvider")
  return context
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<MessageAISDK[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { chatId } = useChatSession()

  useEffect(() => {
    if (chatId === null) {
      setMessages([])
      setIsLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    if (!chatId) return

    const load = async () => {
      setIsLoading(true)

      // First load from cache for instant display
      const cached = await getCachedMessages(chatId)
      if (cached && cached.length > 0) {
        console.log("Loaded messages from cache:", cached.length)
        setMessages(cached)
      }

      try {
        // Then fetch from database for fresh data
        const fresh = await getMessagesFromDb(chatId)
        console.log("Loaded messages from database:", fresh.length)

        // Only update if we got data from database, otherwise keep cache
        if (fresh && fresh.length > 0) {
          setMessages(fresh)
          await cacheMessages(chatId, fresh)
        } else if (!cached || cached.length === 0) {
          // No messages in database or cache
          console.log("No messages found in database or cache for chat:", chatId)
          setMessages([])
        } else {
          // Database returned no messages but cache has messages
          // Keep cache and log warning
          console.warn("Database returned no messages but cache has", cached.length, "messages")
          console.warn("This might indicate a database sync issue")
        }
      } catch (error) {
        console.error("Failed to fetch messages from database:", error)
        console.log("Keeping cached messages")
        // Keep the cached messages we loaded earlier
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [chatId])

  const refresh = async () => {
    if (!chatId) return

    try {
      const fresh = await getMessagesFromDb(chatId)
      setMessages(fresh)
    } catch {
      toast({ title: "Failed to refresh messages", status: "error" })
    }
  }

  const cacheAndAddMessage = async (message: MessageAISDK) => {
    if (!chatId) return

    try {
      setMessages((prev) => {
        const updated = [...prev, message]
        // Save to IndexedDB for offline access and quick loading
        writeToIndexedDB("messages", { id: chatId, messages: updated }).catch((err) => {
          console.error("Failed to write message to IndexedDB:", err)
        })
        return updated
      })
    } catch (error) {
      console.error("Failed to cache message:", error)
      toast({ title: "Failed to save message", status: "error" })
    }
  }

  const saveAllMessages = async (newMessages: MessageAISDK[]) => {
    // @todo: manage the case where the chatId is null (first time the user opens the chat)
    if (!chatId) return

    try {
      await saveMessages(chatId, newMessages)
      setMessages(newMessages)
    } catch {
      toast({ title: "Failed to save messages", status: "error" })
    }
  }

  const deleteMessages = async () => {
    if (!chatId) return

    setMessages([])
    await clearMessagesForChat(chatId)
  }

  const resetMessages = async () => {
    setMessages([])
  }

  return (
    <MessagesContext.Provider
      value={{
        messages,
        isLoading,
        setMessages,
        refresh,
        saveAllMessages,
        cacheAndAddMessage,
        resetMessages,
        deleteMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}
