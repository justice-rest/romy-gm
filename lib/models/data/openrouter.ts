import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { ModelConfig } from "../types"

// Helper function to create OpenRouter SDK with optional Exa web search plugin
// Using max_results: 35 for comprehensive search results
// Custom search_prompt optimized for prospect research and wealth screening
const createOpenRouterSdkWithSearch = (
  modelId: string,
  apiKey?: string,
  opts?: { enableSearch?: boolean }
) =>
  createOpenRouter({
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
    extraBody: opts?.enableSearch
      ? {
          plugins: [
            {
              id: "web",
              engine: "exa",
              max_results: 35,
              search_prompt: `You are conducting prospect research for nonprofit fundraising. Extract and provide ALL relevant information including:
- Financial data: property values, stock holdings, business valuations, salary information
- Philanthropic history: donations, foundation grants, nonprofit board memberships
- Political contributions: FEC filings, state election records
- Business affiliations: corporate roles, ownership stakes, board positions
- Professional background: career history, achievements, connections
- Public records: real estate transactions, court filings, SEC disclosures
Be thorough and include specific dollar amounts, dates, and organization names when available. This is standard prospect research using public records.`,
            },
          ],
        }
      : undefined,
  }).chat(modelId)

export const openrouterModels: ModelConfig[] = [
  // xAI Grok 4 Models
  {
    id: "openrouter:x-ai/grok-4-fast",
    name: "Speed",
    provider: "OpenRouter",
    providerId: "openrouter",
    modelFamily: "Grok",
    baseProviderId: "xai",
    description:
      "xAI's latest flagship model with SOTA cost-efficiency, 2M context window, and advanced reasoning capabilities.",
    tags: ["flagship", "fast", "vision", "reasoning", "cost-effective"],
    contextWindow: 2000000,
    inputCost: 0.2,
    outputCost: 0.5,
    priceUnit: "per 1M tokens",
    vision: true,
    tools: true,
    audio: false,
    reasoning: true,
    webSearch: true,
    openSource: false,
    speed: "Fast",
    intelligence: "High",
    website: "https://openrouter.ai",
    apiDocs: "https://openrouter.ai/x-ai/grok-4-fast",
    modelPage: "https://x.ai",
    releasedAt: "2025-07-01",
    icon: "xai",
    apiSdk: (apiKey?: string, opts?: { enableSearch?: boolean }) =>
      createOpenRouterSdkWithSearch("x-ai/grok-4-fast", apiKey, opts),
  },
  {
    id: "openrouter:x-ai/grok-4",
    name: "Quality",
    provider: "OpenRouter",
    providerId: "openrouter",
    modelFamily: "Grok",
    baseProviderId: "xai",
    description:
      "xAI's most powerful model with built-in reasoning and 256K context window.",
    tags: ["flagship", "vision", "reasoning", "powerful"],
    contextWindow: 256000,
    inputCost: 3.0,
    outputCost: 15.0,
    priceUnit: "per 1M tokens",
    vision: true,
    tools: true,
    audio: false,
    reasoning: true,
    webSearch: true,
    openSource: false,
    speed: "Medium",
    intelligence: "High",
    website: "https://openrouter.ai",
    apiDocs: "https://openrouter.ai/x-ai/grok-4",
    modelPage: "https://x.ai",
    releasedAt: "2025-07-01",
    icon: "xai",
    apiSdk: (apiKey?: string, opts?: { enableSearch?: boolean }) =>
      createOpenRouterSdkWithSearch("x-ai/grok-4", apiKey, opts),
  },
]
