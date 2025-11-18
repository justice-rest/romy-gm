// Search tool for AI SDK integration
import { tool } from "ai"
import { z } from "zod"
import { createExaSearchProvider } from "./exa"
import type { SearchResults } from "./types"

// Schema for the search tool
export const searchSchema = z.object({
  query: z.string().describe("The search query"),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of results to return"),
  searchDepth: z
    .enum(["basic", "advanced"])
    .optional()
    .default("basic")
    .describe("Search depth: basic or advanced"),
  includeDomains: z
    .array(z.string())
    .optional()
    .describe("Domains to include in search"),
  excludeDomains: z
    .array(z.string())
    .optional()
    .describe("Domains to exclude from search"),
})

export type SearchToolInput = z.infer<typeof searchSchema>

// Create the Exa search tool
export function createExaSearchTool() {
  return tool({
    description:
      "Search the web using Exa. Use this tool to find current information, facts, news, and content from across the internet. Exa provides high-quality search results with detailed content.",
    parameters: searchSchema,
    execute: async (args: SearchToolInput): Promise<SearchResults> => {
      const provider = createExaSearchProvider()
      return await provider.search(args)
    },
  })
}

// Helper function to perform a search directly (without tool wrapping)
export async function searchWithExa(
  query: string,
  options?: Partial<Omit<SearchToolInput, "query">>
): Promise<SearchResults> {
  const provider = createExaSearchProvider()
  return await provider.search({
    query,
    ...options,
  })
}
