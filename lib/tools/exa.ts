// Exa search provider implementation
import Exa from "exa-js"
import type {
  SearchOptions,
  SearchProvider,
  SearchResult,
  SearchResults,
} from "./types"

export class ExaSearchProvider implements SearchProvider {
  private client: Exa

  constructor(apiKey?: string) {
    const key = apiKey || process.env.EXA_API_KEY
    if (!key) {
      throw new Error(
        "EXA_API_KEY is not set. Please set it in your environment variables."
      )
    }
    this.client = new Exa(key)
  }

  async search(options: SearchOptions): Promise<SearchResults> {
    const {
      query,
      maxResults = 10,
      searchDepth = "basic",
      includeDomains,
      excludeDomains,
    } = options

    try {
      const response = await this.client.searchAndContents(query, {
        numResults: maxResults,
        useAutoprompt: searchDepth === "advanced",
        highlights: true,
        includeDomains,
        excludeDomains,
      })

      const results: SearchResult[] = response.results.map((result, index) => ({
        id: result.id || `exa-${index}-${Date.now()}`,
        title: result.title || "",
        url: result.url || "",
        content:
          result.highlights && result.highlights.length > 0
            ? result.highlights.join(" ")
            : "",
      }))

      return {
        results,
        query,
        images: [], // Exa doesn't return images in text search
        number_of_results: results.length,
      }
    } catch (error) {
      console.error("Exa search error:", error)
      throw new Error(
        `Exa search failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }
}

// Export a factory function for creating the provider
export function createExaSearchProvider(apiKey?: string): ExaSearchProvider {
  return new ExaSearchProvider(apiKey)
}
