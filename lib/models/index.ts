import { FREE_MODELS_IDS } from "../config"
import { ModelConfig } from "./types"

// Lazy-loaded model data to avoid bundling heavy configs at startup
let staticModelsCache: ModelConfig[] | null = null
let dynamicModelsCache: ModelConfig[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Background loading promise to support synchronous getModelInfo()
let loadingPromise: Promise<ModelConfig[]> | null = null

function startBackgroundLoad(): Promise<ModelConfig[]> {
  if (loadingPromise) return loadingPromise
  if (staticModelsCache) return Promise.resolve(staticModelsCache)

  loadingPromise = (async () => {
    const [{ openrouterModels }, { ollamaModels }] = await Promise.all([
      import("./data/openrouter"),
      import("./data/ollama"),
    ])
    staticModelsCache = [...openrouterModels, ...ollamaModels]
    return staticModelsCache
  })()

  return loadingPromise
}

// Start loading in background on client-side (doesn't block initial render)
if (typeof window !== "undefined") {
  // Defer by 50ms to allow critical render path to complete first
  setTimeout(startBackgroundLoad, 50)
}

// Lazy load static models
async function getStaticModels(): Promise<ModelConfig[]> {
  if (staticModelsCache) return staticModelsCache
  return startBackgroundLoad()
}

// Function to get all models including dynamically detected ones
export async function getAllModels(): Promise<ModelConfig[]> {
  const now = Date.now()

  // Use cache if it's still valid
  if (dynamicModelsCache && now - lastFetchTime < CACHE_DURATION) {
    return dynamicModelsCache
  }

  try {
    const [staticModels, { getOllamaModels }] = await Promise.all([
      getStaticModels(),
      import("./data/ollama"),
    ])

    // Get dynamically detected Ollama models (includes enabled check internally)
    const detectedOllamaModels = await getOllamaModels()

    // Combine static models (excluding static Ollama models) with detected ones
    const staticModelsWithoutOllama = staticModels.filter(
      (model) => model.providerId !== "ollama"
    )

    dynamicModelsCache = [...staticModelsWithoutOllama, ...detectedOllamaModels]

    lastFetchTime = now
    return dynamicModelsCache
  } catch (error) {
    console.warn("Failed to load dynamic models, using static models:", error)
    return getStaticModels()
  }
}

export async function getModelsWithAccessFlags(): Promise<ModelConfig[]> {
  const models = await getAllModels()

  const freeModels = models
    .filter(
      (model) =>
        FREE_MODELS_IDS.includes(model.id) || model.providerId === "ollama"
    )
    .map((model) => ({
      ...model,
      accessible: true,
    }))

  const proModels = models
    .filter((model) => !freeModels.map((m) => m.id).includes(model.id))
    .map((model) => ({
      ...model,
      accessible: false,
    }))

  return [...freeModels, ...proModels]
}

export async function getModelsForProvider(
  provider: string
): Promise<ModelConfig[]> {
  const models = await getStaticModels()

  const providerModels = models
    .filter((model) => model.providerId === provider)
    .map((model) => ({
      ...model,
      accessible: true,
    }))

  return providerModels
}

// Function to get models based on user's available providers
export async function getModelsForUserProviders(
  providers: string[]
): Promise<ModelConfig[]> {
  const providerModels = await Promise.all(
    providers.map((provider) => getModelsForProvider(provider))
  )

  const flatProviderModels = providerModels.flat()

  return flatProviderModels
}

// Synchronous function to get model info for simple lookups
// This uses cached data if available, otherwise returns undefined
export function getModelInfo(modelId: string): ModelConfig | undefined {
  // First check the dynamic cache if it exists
  if (dynamicModelsCache) {
    return dynamicModelsCache.find((model) => model.id === modelId)
  }

  // Then check static cache
  if (staticModelsCache) {
    return staticModelsCache.find((model) => model.id === modelId)
  }

  // Model data not loaded yet - caller should use async getAllModels()
  return undefined
}

// For backward compatibility - returns promise now
export async function getModels(): Promise<ModelConfig[]> {
  return getStaticModels()
}

// Legacy export - deprecated, use getModels() instead
export const MODELS: ModelConfig[] = []

// Function to refresh the models cache
export function refreshModelsCache(): void {
  dynamicModelsCache = null
  lastFetchTime = 0
}
