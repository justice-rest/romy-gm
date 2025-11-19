# AI Memory with OpenRouter - Quick Setup

The AI Memory integration now uses **OpenRouter** for embeddings by default, with automatic fallback to OpenAI if needed.

## Why OpenRouter?

- ✅ **Already integrated** - Your app uses OpenRouter for chat
- ✅ **Multiple models** - Access OpenAI, Qwen, Mistral, and more
- ✅ **Unified billing** - One API key for everything
- ✅ **Flexibility** - Switch embedding models without code changes
- ✅ **Cost options** - Choose between quality and price

## Quick Setup (3 Steps)

### 1. Apply Database Migration

```bash
# In Supabase Dashboard > SQL Editor
# Run: supabase/migrations/20250119000000_create_ai_memories.sql
```

### 2. Configure Environment Variables

```bash
# .env.local

# Option A: Use OpenRouter (Recommended - already configured!)
OPENROUTER_API_KEY=your_openrouter_api_key  # Already have this!

# Optional: Choose embedding model (defaults to openai/text-embedding-3-large)
EMBEDDING_MODEL=openai/text-embedding-3-large

# Option B: Use OpenAI directly
# OPENAI_API_KEY=sk-proj-xxxxx  # Only if not using OpenRouter

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Your App

```bash
npm run dev
```

**That's it!** 🎉 Your AI now has memory using OpenRouter.

## Available Embedding Models

### OpenAI Models (via OpenRouter)
- **`openai/text-embedding-3-large`** (default) - 1536 dims, $0.02/1M tokens
- **`openai/text-embedding-3-large`** - 3072 dims, higher quality, $0.13/1M tokens

### Alternative Models
- **`qwen/qwen3-embedding-0.6b`** - Smaller, faster, cheaper
- **`qwen/qwen3-embedding-8b`** - Larger, more capable
- **`mistralai/mistral-embed-2312`** - Mistral's embedding model

View all models: [OpenRouter Embeddings](https://openrouter.ai/models?fmt=cards&output_modalities=embeddings)

## Switching Models

Change the `EMBEDDING_MODEL` environment variable:

```bash
# Use a cheaper model
EMBEDDING_MODEL=qwen/qwen3-embedding-0.6b

# Use a higher quality model
EMBEDDING_MODEL=openai/text-embedding-3-large
```

**Important:** If changing embedding dimensions:
1. Update the migration SQL (`vector(1536)` → new dimension)
2. Drop and recreate the HNSW index
3. Regenerate all existing embeddings

## Cost Comparison

Based on 1,000 memories/month (100 tokens avg per memory = 100K tokens):

| Model | Dimensions | Cost/1M tokens | Monthly Cost |
|-------|------------|----------------|--------------|
| openai/text-embedding-3-large | 1536 | $0.02 | **$0.002** |
| qwen/qwen3-embedding-0.6b | 768 | $0.01 | **$0.001** |
| openai/text-embedding-3-large | 3072 | $0.13 | **$0.013** |

All options are extremely cheap! 💰

## Automatic Fallback

The integration automatically handles provider selection:

1. **If `OPENROUTER_API_KEY` is set** → Uses OpenRouter ✅
2. **Else if `OPENAI_API_KEY` is set** → Uses OpenAI directly
3. **Else** → Memory disabled (logs warning)

## How It Works

```typescript
// Automatic provider detection
const config = getAIMemoryConfig();

if (config.useOpenRouter) {
  // Uses OpenRouter endpoint
  client = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
  });
} else {
  // Uses OpenAI directly
  client = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
}
```

## Testing

1. Start a chat
2. Say: **"I prefer email over phone"**
3. Start a new chat
4. Ask: **"What's my communication preference?"**
5. AI should recall: **"You prefer email"**

## Verify in Database

```sql
SELECT
  content,
  (embedding IS NOT NULL) as has_embedding,
  created_at
FROM ai_memories
WHERE user_id = 'your_user_id'
ORDER BY created_at DESC
LIMIT 5;
```

## Troubleshooting

### "AI Memory is not configured"

**Solution:**
- Ensure `OPENROUTER_API_KEY` is set (you already have this!)
- Or set `OPENAI_API_KEY` as fallback
- Restart dev server

### Embeddings not generating

**Check logs for:**
- API key validation errors
- Model availability
- Rate limiting

**Test manually:**
```bash
curl https://openrouter.ai/api/v1/embeddings \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/text-embedding-3-large",
    "input": "test"
  }'
```

### Different dimension count

If using a model with different dimensions:

1. **Update migration SQL:**
   ```sql
   embedding vector(768)  -- for qwen3-embedding-0.6b
   ```

2. **Recreate index:**
   ```sql
   DROP INDEX ai_memories_embedding_idx;
   CREATE INDEX ai_memories_embedding_idx ON ai_memories
     USING hnsw (embedding vector_cosine_ops)
     WITH (m = 16, ef_construction = 64);
   ```

## Advanced Configuration

### Custom Headers

The integration automatically sets:
- `HTTP-Referer`: Your app URL
- `X-Title`: "AI Memory"

These help OpenRouter track usage and provide better analytics.

### Provider Preferences

OpenRouter allows provider routing:

```typescript
// In lib/ai-memory/index.ts, you can add:
defaultHeaders: {
  'X-Provider-Preference': 'OpenAI,Together'  // Prefer OpenAI, fallback to Together
}
```

## Monitoring

### OpenRouter Dashboard
- View usage: [OpenRouter Activity](https://openrouter.ai/activity)
- Track costs per model
- See request counts

### Supabase Dashboard
- Monitor memory storage growth
- Check embedding generation success
- Review query performance

## Benefits vs Direct OpenAI

| Feature | OpenRouter | Direct OpenAI |
|---------|-----------|---------------|
| **Setup** | Already have key ✅ | Need separate key |
| **Billing** | Unified with chat | Separate billing |
| **Model choice** | Multiple providers | OpenAI only |
| **Switching** | Change env var | Change provider |
| **Monitoring** | Single dashboard | Multiple dashboards |

## Next Steps

1. ✅ Set `OPENROUTER_API_KEY` (already done!)
2. ✅ Apply migration
3. ✅ Test memory storage/retrieval
4. 🎯 Choose optimal embedding model
5. 📊 Monitor usage and costs

## Resources

- [OpenRouter Embeddings Docs](https://openrouter.ai/docs/api-reference/embeddings)
- [Available Embedding Models](https://openrouter.ai/models?fmt=cards&output_modalities=embeddings)
- [Full AI Memory Docs](./AI_MEMORY_INTEGRATION.md)
- [OpenRouter Dashboard](https://openrouter.ai/activity)

---

**Using OpenRouter makes AI Memory even simpler - one API key, unlimited possibilities!** 🚀✨
