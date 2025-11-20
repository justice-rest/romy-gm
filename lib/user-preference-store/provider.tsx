"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/lib/user-store/provider"
import { useTheme } from "next-themes"
import { createContext, ReactNode, useContext, useEffect } from "react"
import {
  convertFromApiFormat,
  convertToApiFormat,
  defaultPreferences,
  type LayoutType,
  type ThemeType,
  type UserPreferences,
} from "./utils"

export {
  type LayoutType,
  type ThemeType,
  type UserPreferences,
  convertFromApiFormat,
  convertToApiFormat,
}

const PREFERENCES_STORAGE_KEY = "user-preferences"
const LAYOUT_STORAGE_KEY = "preferred-layout"

interface UserPreferencesContextType {
  preferences: UserPreferences
  setLayout: (layout: LayoutType) => void
  setTheme: (theme: ThemeType) => void
  setShowToolInvocations: (enabled: boolean) => void
  setShowConversationPreviews: (enabled: boolean) => void
  setMultiModelEnabled: (enabled: boolean) => void
  toggleModelVisibility: (modelId: string) => void
  isModelHidden: (modelId: string) => boolean
  isLoading: boolean
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch("/api/user-preferences")
  if (!response.ok) {
    throw new Error("Failed to fetch user preferences")
  }
  const data = await response.json()
  return convertFromApiFormat(data)
}

async function updateUserPreferences(
  update: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await fetch("/api/user-preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(convertToApiFormat(update)),
  })

  if (!response.ok) {
    throw new Error("Failed to update user preferences")
  }

  const data = await response.json()
  return convertFromApiFormat(data)
}

function getLocalStoragePreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences

  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fallback to legacy layout storage if JSON parsing fails
    }
  }

  const layout = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType | null
  return {
    ...defaultPreferences,
    ...(layout ? { layout } : {}),
  }
}

function saveToLocalStorage(preferences: UserPreferences) {
  if (typeof window === "undefined") return

  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  localStorage.setItem(LAYOUT_STORAGE_KEY, preferences.layout)
}

export function UserPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: ReactNode
  initialPreferences?: UserPreferences
}) {
  const { user } = useUser()
  const userId = user?.id
  const isAuthenticated = !!userId
  const queryClient = useQueryClient()
  const { setTheme: setNextTheme } = useTheme()

  // Merge initial preferences with defaults
  const getInitialData = (): UserPreferences => {
    if (initialPreferences && isAuthenticated) {
      return initialPreferences
    }

    return defaultPreferences
  }

  // Query for user preferences
  const { data: preferences = getInitialData(), isLoading } =
    useQuery<UserPreferences>({
      queryKey: ["user-preferences", userId],
      queryFn: async () => {
        if (!isAuthenticated) {
          return defaultPreferences
        }

        return await fetchUserPreferences()
      },
      enabled: typeof window !== "undefined" && isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      // Use initial data if available to avoid unnecessary API calls
      initialData: initialPreferences ? initialPreferences : undefined,
    })

  // Mutation for updating preferences
  const mutation = useMutation({
    mutationFn: async (update: Partial<UserPreferences>) => {
      if (!isAuthenticated) {
        return { ...preferences, ...update }
      }

      return await updateUserPreferences(update)
    },
    onMutate: async (update) => {
      const queryKey = ["user-preferences", userId]
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<UserPreferences>(queryKey)
      const optimistic = { ...previous, ...update }
      queryClient.setQueryData(queryKey, optimistic)

      return { previous }
    },
    onError: (_err, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user-preferences", userId], context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-preferences", userId], data)
    },
  })

  const updatePreferences = mutation.mutate

  const setLayout = (layout: LayoutType) => {
    console.log("[UserPreferences] Setting layout to:", layout, "isAuthenticated:", isAuthenticated)
    updatePreferences({ layout })
  }

  const setTheme = (theme: ThemeType) => {
    console.log("[UserPreferences] Setting theme to:", theme, "isAuthenticated:", isAuthenticated)
    updatePreferences({ theme })
  }

  const setShowToolInvocations = (enabled: boolean) => {
    updatePreferences({ showToolInvocations: enabled })
  }

  const setShowConversationPreviews = (enabled: boolean) => {
    updatePreferences({ showConversationPreviews: enabled })
  }

  const setMultiModelEnabled = (enabled: boolean) => {
    updatePreferences({ multiModelEnabled: enabled })
  }

  const toggleModelVisibility = (modelId: string) => {
    const currentHidden = preferences.hiddenModels || []
    const isHidden = currentHidden.includes(modelId)
    const newHidden = isHidden
      ? currentHidden.filter((id) => id !== modelId)
      : [...currentHidden, modelId]

    updatePreferences({ hiddenModels: newHidden })
  }

  const isModelHidden = (modelId: string) => {
    return (preferences.hiddenModels || []).includes(modelId)
  }

  // Sync theme from database to next-themes when preferences load
  useEffect(() => {
    if (preferences.theme) {
      console.log("[UserPreferences] Syncing theme from database to next-themes:", preferences.theme)
      setNextTheme(preferences.theme)
    }
  }, [preferences.theme, setNextTheme])

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setLayout,
        setTheme,
        setShowToolInvocations,
        setShowConversationPreviews,
        setMultiModelEnabled,
        toggleModelVisibility,
        isModelHidden,
        isLoading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    )
  }
  return context
}
