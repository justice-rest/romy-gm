# AI Memory Integration Guide (Supabase + pgvector)

This project implements AI memory capabilities using **Supabase's pgvector extension**, enabling long-term memory across chat sessions. The AI can remember important information from previous conversations and provide more personalized responses through semantic search.

## What is AI Memory?

AI Memory is a native Supabase-based solution that provides:
- **Long-term memory storage** - Persist information across chat sessions in PostgreSQL
- **Semantic search** - Retrieve relevant memories using vector similarity (cosine distance)
- **User isolation** - Each user's memories are kept separate via database constraints
- **Automatic memory management** - AI decides when to save and retrieve information
- **Production-ready** - Built on battle-tested PostgreSQL + pgvector

## Architecture Overview

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
    OpenAI Embeddings API
         ↓
    Supabase PostgreSQL + pgvector
         ↓
    Vector Similarity Search (Cosine)
```

## How It Works

The integration provides two AI tools that work automatically:

### 1. **`searchMemories`** - Semantic Memory Retrieval
- Converts search query to embedding vector using OpenAI
- Searches database using cosine similarity
- Returns top-N most relevant memories above similarity threshold
- Supports customizable limit (1-10) and threshold (0-1)

### 2. **`addMemory`** - Intelligent Memory Storage
- Converts memory content to embedding vector
- Stores in PostgreSQL with user isolation
- Supports metadata tagging for categorization
- Automatically timestamps and tracks chat context

## Setup Instructions

### Prerequisites

You need:
1. **OpenAI API Key** - For generating embeddings
2. **Supabase Project** - Already configured in this app
3. **Database Migration** - Apply the pgvector migration

### Step 1: Apply Database Migration

The migration file creates:
- `pgvector` extension
- `ai_memories` table with vector column
- HNSW index for fast similarity search
- Row-level security policies
- Helper functions

**Apply the migration:**

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
# Run the contents of: supabase/migrations/20250119000000_create_ai_memories.sql
```

### Step 2: Configure Environment Variables

Add your OpenAI API key (Supabase credentials already configured):

```bash
# In your .env.local file
OPENAI_API_KEY=your_openai_api_key_here

# Already configured (no changes needed)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Verify the Integration

The integration is automatically enabled when:
- A valid `OPENAI_API_KEY` is present
- Supabase is configured
- The user is authenticated
- The chat session is active

**Test it:**
1. Start a new chat
2. Share personal preferences or information
3. Start a new chat in a different session
4. Ask about the information you previously shared

The AI should recall the information using semantic search.

## Features

### User-Specific Memory Isolation

Each user's memories are isolated using:
- **Foreign key constraint**: `user_id` → `users.id`
- **Row-level security (RLS)**: Enforces user-only access
- **Database-level isolation**: No cross-user memory leakage possible

### Semantic Search with pgvector

- **Vector embeddings**: 1536-dimensional vectors (OpenAI text-embedding-3-small)
- **Cosine similarity**: Finds conceptually similar memories, not just keyword matches
- **HNSW indexing**: High-performance search at scale
- **Configurable threshold**: Filter by minimum similarity score

### Automatic Memory Management

The AI automatically:
- Identifies important information to save
- Searches for relevant memories before responding
- Builds a continuous relationship across chat sessions
- Manages memory metadata for better organization

## Technical Details

### Database Schema

```sql
create table public.ai_memories (
  id uuid primary key,
  user_id text not null references users(id),
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  chat_id text,
  created_at timestamptz,
  updated_at timestamptz
);

-- HNSW index for fast similarity search
create index ai_memories_embedding_idx on ai_memories
  using hnsw (embedding vector_cosine_ops);
```

### Memory Search Function

```sql
create function match_ai_memories(
  query_embedding vector(1536),
  query_user_id text,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity float,
  ...
);
```

### Integration Points

The AI Memory integration is implemented in:

1. **Memory Utilities** ([lib/ai-memory/index.ts](lib/ai-memory/index.ts))
   - Configuration management
   - Tool initialization
   - Embedding generation
   - Database operations

2. **Chat API Route** ([app/api/chat/route.ts](app/api/chat/route.ts))
   - Tool integration with AI SDK
   - System prompt enhancement
   - Memory-aware conversations

3. **Database Migration** ([supabase/migrations/20250119000000_create_ai_memories.sql](supabase/migrations/20250119000000_create_ai_memories.sql))
   - Schema definition
   - Indexes and constraints
   - Security policies

### Embedding Generation

Uses OpenAI's `text-embedding-3-small` model:
- **Dimensions**: 1536
- **Cost**: ~$0.02 per 1M tokens
- **Speed**: ~50ms per embedding
- **Quality**: High semantic understanding

### Memory Storage Format

```typescript
{
  id: "uuid",
  user_id: "user123",
  content: "User prefers email communication over phone calls",
  embedding: [0.123, -0.456, ...], // 1536 dimensions
  metadata: {
    importance: "high",
    category: "preference",
    tags: ["communication"]
  },
  chat_id: "chat456",
  created_at: "2025-01-19T10:30:00Z",
  updated_at: "2025-01-19T10:30:00Z"
}
```

### Tool Usage Examples

```typescript
// AI searches for user preferences
await searchMemories({
  query: "user's fundraising experience and preferences",
  limit: 5,
  threshold: 0.7
})
// Returns: { success: true, memories: [...], count: 5 }

// AI saves new information
await addMemory({
  content: "User prefers email communication over phone calls",
  metadata: { category: "preference", importance: "high" }
})
// Returns: { success: true, memoryId: "uuid", message: "Memory saved successfully" }
```

## Configuration Options

### Search Parameters

Customize in tool calls:
```typescript
searchMemories({
  query: "search query",
  limit: 10,        // Max results (1-10)
  threshold: 0.75   // Min similarity (0-1, higher = more similar)
})
```

### Memory Metadata

Add custom metadata:
```typescript
addMemory({
  content: "Memory content",
  metadata: {
    importance: "high" | "medium" | "low",
    category: "preference" | "experience" | "goal",
    tags: ["tag1", "tag2"],
    source: "onboarding" | "chat",
    // ... any custom fields
  }
})
```

### System Prompt Customization

Modify memory instructions in [app/api/chat/route.ts:115-127](app/api/chat/route.ts).

## Best Practices

### What to Remember

The AI should save:
- User preferences and communication style
- Organization details and context
- Past fundraising experiences and outcomes
- Goals, objectives, and priorities
- Important decisions and their reasoning
- Recurring patterns or themes

### What NOT to Remember

Avoid saving:
- Sensitive personal information (unless explicitly needed)
- Temporary session data
- Information that changes frequently
- Redundant or trivial facts
- Generic/obvious information

### Memory Search Tips

- **Be specific**: "user's preferred communication method" > "communication"
- **Use context**: Include relevant keywords for better matching
- **Adjust threshold**: Lower for broader results, higher for precision
- **Limit results**: Default 5 is usually sufficient

### Metadata Recommendations

```typescript
// Good metadata structure
{
  importance: "high",      // Priority level
  category: "preference",   // Type of memory
  tags: ["email", "async"], // Searchable tags
  confidence: 0.95,         // How certain the info is
  source: "explicit"        // How it was obtained
}
```

## Performance Considerations

- **Embedding generation**: ~50-100ms per query/memory
- **Vector search**: ~10-50ms with HNSW index
- **Total latency**: ~100-200ms per memory operation
- **Scalability**: Handles millions of memories efficiently
- **Cost**: ~$0.02 per 1M embedding tokens (very cheap)

### Optimization Tips

1. **Batch operations**: Combine related memories
2. **Index tuning**: Adjust HNSW parameters for your scale
3. **Caching**: Cache frequent searches (optional)
4. **Pruning**: Delete old/irrelevant memories periodically

## Privacy & Security

### Database-Level Security

- **Row-level security (RLS)**: Enforced by PostgreSQL
- **User isolation**: Foreign key constraints prevent cross-user access
- **Encrypted at rest**: Supabase encryption by default
- **API key security**: OpenAI key stored in environment, never exposed

### RLS Policies

```sql
-- Users can only access their own memories
create policy "Users can read own memories"
  on ai_memories for select
  using (user_id = auth.uid()::text);

-- Similar policies for insert, update, delete
```

## Troubleshooting

### Memory Not Working

**Check OpenAI API Key**
```bash
echo $OPENAI_API_KEY
```

**Check Migration Applied**
```sql
-- In Supabase SQL Editor
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'ai_memories'
);
```

**Check Logs**
- Look for "AI Memory is not configured" warnings
- Check for embedding generation errors
- Verify Supabase connection

### Memory Not Retrieving

Possible causes:
- No relevant information was previously saved
- Search query too specific or too vague
- Similarity threshold too high
- Embeddings not generated correctly

**Debug search:**
```typescript
// Lower threshold to see all matches
searchMemories({ query: "test", threshold: 0.0, limit: 10 })
```

### Performance Issues

If searches are slow:
1. **Check HNSW index**: Ensure it's created
2. **Tune parameters**: Adjust `m` and `ef_construction`
3. **Monitor query time**: Use Supabase performance insights
4. **Prune old data**: Delete unused memories

## API Reference

### `getAIMemoryTools(userId, chatId?)`

Initializes AI Memory tools for a user.

**Parameters:**
- `userId: string` - Required. User identifier for memory isolation
- `chatId?: string` - Optional. Chat identifier for context

**Returns:**
- `ToolSet | null` - AI Memory tools or null if not configured

### `isAIMemoryEnabled()`

Checks if AI Memory is properly configured.

**Returns:**
- `boolean` - True if enabled, false otherwise

### `getUserMemories(userId, limit?, offset?)`

Retrieves all memories for a user (for management UI).

**Parameters:**
- `userId: string` - User identifier
- `limit?: number` - Max results (default: 50)
- `offset?: number` - Pagination offset (default: 0)

**Returns:**
- `Promise<MemorySearchResult[]>` - Array of memories

### `deleteMemories(memoryIds, userId)`

Batch delete memories by IDs.

**Parameters:**
- `memoryIds: string[]` - Array of memory UUIDs
- `userId: string` - User identifier for security

**Returns:**
- `Promise<boolean>` - Success status

## Migration from Supermemory

If you previously used Supermemory:

1. **Remove dependencies**:
   ```bash
   npm uninstall supermemory
   ```

2. **Environment variables**:
   - Remove: `SUPERMEMORY_API_KEY`
   - Keep: `OPENAI_API_KEY`, Supabase keys

3. **Data migration** (optional):
   - Export memories from Supermemory
   - Transform to new schema
   - Bulk insert via Supabase

4. **No code changes needed** - The tool interface is identical!

## Comparison: Supabase vs. Supermemory

| Feature | Supabase (This) | Supermemory |
|---------|----------------|-------------|
| **Storage** | Your PostgreSQL | External service |
| **Cost** | Database + embeddings | API subscription |
| **Latency** | ~100-200ms | ~200-400ms |
| **Data ownership** | Full control | Third-party |
| **Scalability** | Unlimited | Plan limits |
| **Integration** | Native to stack | External API |
| **Privacy** | Complete | Shared infrastructure |

## Resources

- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)

## Support

For issues with:
- **Database/pgvector**: Check [Supabase Discussions](https://github.com/supabase/supabase/discussions)
- **Embeddings**: See [OpenAI Help Center](https://help.openai.com/)
- **Integration**: Create an issue in this project's repository

## Advanced Usage

### Custom Embedding Models

To use different embedding models:

```typescript
// In lib/ai-memory/index.ts
const response = await openai.embeddings.create({
  model: 'text-embedding-3-large', // 3072 dimensions
  input: text,
});

// Update migration to match dimensions:
// embedding vector(3072)
```

### Hybrid Search (Keyword + Semantic)

Combine with full-text search:

```sql
-- Add tsvector column
ALTER TABLE ai_memories ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Hybrid search function
CREATE FUNCTION hybrid_search(...) AS $$
  -- Combine vector similarity + text search
$$;
```

### Memory Importance Scoring

```typescript
addMemory({
  content: "Critical user preference",
  metadata: {
    importance: calculateImportance(content),
    confidence: 0.95,
    decay_factor: 0.1 // For time-based relevance
  }
})
```

## License

This integration is part of the main project. See project LICENSE for details.
