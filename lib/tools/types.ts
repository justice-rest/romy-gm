// Types for search tools and results

export interface SearchResult {
  id?: string
  title: string
  url: string
  content: string
}

export interface SearchResults {
  results: SearchResult[]
  query: string
  images: string[]
  number_of_results: number
}

export type SearchDepth = "basic" | "advanced"

export interface SearchOptions {
  query: string
  maxResults?: number
  searchDepth?: SearchDepth
  includeDomains?: string[]
  excludeDomains?: string[]
}

export interface SearchProvider {
  search(options: SearchOptions): Promise<SearchResults>
}
