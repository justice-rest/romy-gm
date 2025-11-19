# Supermemory Integration Guide

This project integrates [Supermemory](https://supermemory.ai) to enable long-term memory capabilities across chat sessions. The AI can now remember important information from previous conversations and provide more personalized responses.

## What is Supermemory?

Supermemory is a Universal Memory API for AI applications that provides:
- **Long-term memory storage** - Persist information across chat sessions
- **Semantic search** - Retrieve relevant memories based on context
- **User isolation** - Each user's memories are kept separate using container tags
- **Automatic memory management** - AI decides when to save and retrieve information

## How It Works

The integration provides two AI tools that work automatically:

1. **`searchMemories`** - Searches for relevant information from past conversations
   - Triggered when the AI needs context from previous chats
   - Returns relevant memories based on semantic similarity

2. **`addMemory`** - Saves important information to long-term memory
   - Triggered when the AI identifies key facts, preferences, or insights
   - Stores information with user-specific container tags for isolation

## Setup Instructions

### 1. Get a Supermemory API Key

1. Visit [Supermemory Console](https://console.supermemory.ai)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the API key for the next step

### 2. Configure Environment Variables

Add your Supermemory API key to your environment:

```bash
# In your .env.local file
SUPERMEMORY_API_KEY=your_supermemory_api_key_here
```

The integration will automatically detect the API key and enable memory features.

### 3. Verify the Integration

The integration is automatically enabled when:
- A valid `SUPERMEMORY_API_KEY` is present in the environment
- The user is authenticated
- The chat session is active

You can verify it's working by:
1. Starting a new chat
2. Sharing personal preferences or information
3. Starting a new chat in a different session
4. Asking about the information you previously shared

The AI should recall the information from the previous conversation.

## Features

### User-Specific Memory Isolation

Each user's memories are isolated using container tags:
- Format: `user:{userId}`
- Ensures privacy and prevents cross-user memory leakage
- Optional chat-level isolation with `chat:{chatId}` tags

### Automatic Memory Management

The AI automatically:
- Identifies important information to save
- Searches for relevant memories before responding
- Builds a continuous relationship across chat sessions

### Integration Points

The Supermemory integration is implemented in:

1. **Memory Utilities** ([lib/supermemory/index.ts](lib/supermemory/index.ts))
   - Configuration management
   - Tool initialization
   - Helper functions

2. **Chat API Route** ([app/api/chat/route.ts](app/api/chat/route.ts))
   - Tool integration with AI SDK
   - System prompt enhancement
   - Memory-aware conversations

## Technical Details

### Architecture

```
User Message
    ↓
Chat API Route
    ↓
AI Model + Native AI SDK Tools
    ↓
┌─────────────────┬──────────────────┐
│  searchMemories │   addMemory      │
│  (retrieve)     │   (store)        │
└─────────────────┴──────────────────┘
         ↓                    ↓
    Supermemory REST API
         ↓
    Vector Database (Supermemory)
```

### Implementation Details

This integration uses **native AI SDK tools** that make direct REST API calls to Supermemory, rather than using the `@supermemory/tools` package. This approach:
- Avoids Zod version conflicts between dependencies
- Provides better control over API requests and responses
- Reduces bundle size by eliminating unnecessary dependencies
- Ensures compatibility with your existing AI SDK version

### Memory Storage

Memories are stored with:
- **User ID** - Container tag for user isolation
- **Content** - The actual information to remember
- **Embeddings** - Vector representations for semantic search
- **Metadata** - Optional chat ID and timestamps

### Tool Usage

The AI uses tools naturally in conversations:

```typescript
// Example: AI searches for user preferences
const result = await searchMemories({
  query: "user's fundraising experience and preferences",
  limit: 5
})
// Returns: { success: true, memories: [...], count: 5 }

// Example: AI saves new information
await addMemory({
  content: "User prefers email communication over phone calls",
  title: "Communication Preference"
})
// Returns: { success: true, memoryId: "mem_xyz", message: "Memory saved successfully" }
```

### API Endpoints

The tools make requests to the following Supermemory endpoints:

**Search Memories:**
- `POST https://api.supermemory.ai/v1/search`
- Headers: `x-api-key`, `Content-Type: application/json`
- Body: `{ query, limit, containerTags }`

**Add Memory:**
- `POST https://api.supermemory.ai/v1/memories`
- Headers: `x-api-key`, `Content-Type: application/json`
- Body: `{ content, title, containerTags }`

## Configuration Options

### Container Tags

Modify container tags in [lib/supermemory/index.ts](lib/supermemory/index.ts):

```typescript
const containerTags = [
  `user:${userId}`,
  // Add additional tags as needed
  `organization:${orgId}`,
  `project:${projectId}`,
]
```

### System Prompt

The integration automatically adds memory instructions to the system prompt:

- Explains available memory tools
- Encourages proactive memory usage
- Provides guidance on what to remember

Customize the prompt in [app/api/chat/route.ts](app/api/chat/route.ts:115-127).

## Best Practices

### What to Remember

The AI should save:
- User preferences and communication style
- Organization details and context
- Past experiences and outcomes
- Goals and objectives
- Important decisions and reasons

### What NOT to Remember

Avoid saving:
- Sensitive personal information (unless necessary)
- Temporary data or session-specific info
- Information that changes frequently
- Redundant or obvious facts

### Memory Search

- Search before answering questions about the user
- Use specific search queries for better results
- Limit results to avoid context overflow (default: 5)

## Troubleshooting

### Memory Not Working

1. **Check API Key**
   ```bash
   echo $SUPERMEMORY_API_KEY
   ```
   Ensure the key is set and valid.

2. **Verify Authentication**
   - Memory tools only work for authenticated users
   - Guest users don't have memory capabilities

3. **Check Logs**
   - Look for Supermemory initialization messages
   - Check for tool invocation errors in console

### Memory Not Retrieving

- The AI may not find memories if:
  - No relevant information was previously saved
  - Search query is too specific or vague
  - Container tags don't match

### Too Many Memories

If the AI retrieves too many irrelevant memories:
- Reduce the `limit` parameter in search queries
- Use more specific search queries
- Clear old memories via Supermemory console

## API Reference

### `getSupermemoryTools(userId, chatId?)`

Initializes Supermemory tools for a user.

**Parameters:**
- `userId: string` - Required. User identifier for memory isolation
- `chatId?: string` - Optional. Chat identifier for additional isolation

**Returns:**
- `ToolSet | null` - Supermemory tools or null if not configured

**Example:**
```typescript
const tools = getSupermemoryTools('user-123', 'chat-456')
```

### `isSupermemoryEnabled()`

Checks if Supermemory is properly configured.

**Returns:**
- `boolean` - True if enabled, false otherwise

**Example:**
```typescript
if (isSupermemoryEnabled()) {
  // Use memory features
}
```

## Performance Considerations

- Memory searches add ~100-300ms latency per query
- Tool calls are asynchronous and don't block streaming
- Memories are indexed for fast semantic search
- Container tags enable efficient memory isolation

## Privacy & Security

- Each user's memories are isolated by container tags
- Memories are stored in Supermemory's secure infrastructure
- No cross-user memory access is possible
- API keys should be kept secure and not exposed to clients

## Resources

- [Supermemory Documentation](https://supermemory.ai/docs)
- [AI SDK Integration Guide](https://supermemory.ai/docs/cookbook/ai-sdk-integration)
- [Supermemory Console](https://console.supermemory.ai)
- [GitHub Repository](https://github.com/supermemoryai/supermemory)

## Support

For issues with:
- **Supermemory API**: Visit [Supermemory Support](https://supermemory.ai/support)
- **Integration**: Create an issue in this project's repository
- **General Questions**: Check the [Supermemory Discord](https://discord.gg/supermemory)
