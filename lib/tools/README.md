# Exa Search Tool Integration

This directory contains the Exa search tool implementation that works alongside OpenRouter's web search plugin to provide enhanced search capabilities for LLMs.

## Overview

The Exa search tool provides an additional search interface that LLMs can use to find current information, facts, news, and content from across the internet. This implementation is inspired by the [Morphic](https://github.com/miurla/morphic) project and works in parallel with OpenRouter's built-in web search plugin powered by Exa.

## Architecture

### Files

- **`types.ts`** - Type definitions for search results, options, and provider interfaces
- **`exa.ts`** - Exa search provider implementation using the exa-js SDK
- **`search.ts`** - AI SDK tool wrapper for the Exa search functionality
- **`index.ts`** - Exports for all tools and utilities

### Key Components

#### ExaSearchProvider

The `ExaSearchProvider` class implements the search interface and handles:
- API authentication using `EXA_API_KEY` environment variable
- Search query execution with configurable parameters
- Result processing and formatting
- Error handling

#### createExaSearchTool()

Creates an AI SDK tool that can be used in streaming contexts with the following parameters:
- `query` (required): The search query string
- `maxResults` (optional, default: 10): Maximum number of results to return
- `searchDepth` (optional, default: "basic"): Search depth ("basic" or "advanced")
- `includeDomains` (optional): Array of domains to include in search
- `excludeDomains` (optional): Array of domains to exclude from search

## Usage

### Setup

1. Add your Exa API key to your `.env` file:
   ```bash
   EXA_API_KEY=your_exa_api_key
   ```

2. The tool is automatically registered in the chat API route if the API key is present.

### How It Works

When a user sends a message:

1. **OpenRouter Web Search Plugin** (if enabled via `enableSearch` flag):
   - Automatically triggers for relevant queries
   - Uses Exa's engine with customized search prompts
   - Returns up to 35 results optimized for prospect research

2. **Exa Search Tool** (if `EXA_API_KEY` is set):
   - Available as a separate tool that the LLM can explicitly call
   - Provides direct control over search parameters
   - Returns structured results with titles, URLs, and content
   - Results are automatically displayed in the UI as clickable sources

### Sources Display

Search results from the Exa tool are automatically displayed in two ways:

1. **Sources List** - A collapsible component showing all search results with:
   - Favicon icons for each domain
   - Clickable links to the original sources
   - Clean, formatted URLs
   - Displays below the assistant's message content

2. **Tool Invocation Panel** - An expandable panel showing:
   - The search query and parameters used
   - Full search results with titles, URLs, and content snippets
   - Highlighted content excerpts from each result (up to 3 lines)
   - Execution status (Running → Completed)
   - Tool call ID for debugging

The sources are extracted from tool invocation results via [`app/components/chat/get-sources.ts`](../../app/components/chat/get-sources.ts) and displayed using the existing [`SourcesList`](../../app/components/chat/sources-list.tsx) and [`ToolInvocation`](../../app/components/chat/tool-invocation.tsx) components, providing a consistent UI experience across all search tools.

### Example Usage in Code

```typescript
import { createExaSearchTool, searchWithExa } from '@/lib/tools'

// Create a tool for AI SDK
const exaSearchTool = createExaSearchTool()

// Or use the search function directly
const results = await searchWithExa('latest AI developments', {
  maxResults: 20,
  searchDepth: 'advanced',
  includeDomains: ['techcrunch.com', 'theverge.com']
})
```

### Integration with Chat API

The Exa search tool is automatically integrated in [`app/api/chat/route.ts`](../../app/api/chat/route.ts):

```typescript
// Create tools object - add Exa search tool alongside OpenRouter's web search plugin
const tools: ToolSet = {}

// Add Exa search tool if EXA_API_KEY is available
if (process.env.EXA_API_KEY) {
  tools.exa_search = createExaSearchTool()
}
```

## Differences from OpenRouter Web Search Plugin

| Feature | OpenRouter Plugin | Exa Search Tool |
|---------|------------------|-----------------|
| **Trigger** | Automatic (when `enableSearch` is true) | Manual (LLM decides when to call) |
| **Max Results** | 35 | 10 (configurable) |
| **Search Prompt** | Custom optimized for prospect research | Standard Exa search |
| **Control** | Handled by OpenRouter | Direct control via tool parameters |
| **Use Case** | Broad context gathering | Targeted, specific searches |

## Benefits of Dual Search Implementation

1. **Redundancy**: If one search method fails, the other is available
2. **Flexibility**: LLM can choose the appropriate search method for the task
3. **Expandability**: Easy to add custom search logic, filtering, or post-processing
4. **Control**: Direct access to Exa's features without OpenRouter's abstraction
5. **Debugging**: Easier to track and debug search calls made via the tool

## Future Enhancements

Potential areas for expansion:

- **Similar content search**: Use Exa's similarity search features
- **Temporal filtering**: Add date range filters for time-sensitive queries
- **Category filtering**: Filter by content type (news, blogs, academic, etc.)
- **Custom ranking**: Implement custom result ranking algorithms
- **Caching**: Add result caching to reduce API calls
- **Analytics**: Track search patterns and popular queries
- **Multi-provider**: Support multiple search backends (Brave, Tavily, etc.)

## Dependencies

- `exa-js` (^1.6.13): Official Exa JavaScript SDK
- `ai`: Vercel AI SDK for tool creation
- `zod`: Schema validation for tool parameters

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXA_API_KEY` | Yes | Your Exa API key from https://exa.ai |

## Error Handling

The implementation includes comprehensive error handling:

- Missing API key throws a descriptive error
- Search failures are caught and logged
- Graceful degradation if the tool is not available

## Performance Considerations

- Search requests are asynchronous and don't block the main thread
- Results are streamed back to the client as they're processed
- The tool respects the `maxSteps` limit in the streaming configuration

## UI Components Integration

The Exa search tool is fully integrated with the existing UI components:

### Modified Files for UI Integration

1. **[`app/components/chat/get-sources.ts`](../../app/components/chat/get-sources.ts)**
   - Added handler for `exa_search` tool results
   - Extracts `results` array from tool invocation response
   - Filters valid sources with required fields (id, url, title)

2. **[`app/components/chat/tool-invocation.tsx`](../../app/components/chat/tool-invocation.tsx)**
   - Enhanced to recognize Exa search result structure
   - Custom rendering for search results with content snippets
   - Shows up to 3 lines of highlighted content per result
   - Clickable links with hover effects

3. **[`lib/tools/types.ts`](types.ts)**
   - Added `id` field to `SearchResult` interface
   - Ensures compatibility with UI components

### User Experience

When the LLM uses the Exa search tool:

1. User sees "Running" status in the tool invocation panel
2. Once complete, status changes to "Completed" with a checkmark
3. Sources appear both in:
   - **Tool panel** (expanded by default) with full details
   - **Sources list** (collapsed by default) with favicon icons
4. All links open in new tabs with proper security attributes
5. Content highlights are limited to 3 lines for better readability

## License

This implementation follows the same license as the main project.
