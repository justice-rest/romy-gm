# AI Memory Setup Instructions

Quick setup guide for the new Supabase + pgvector AI Memory integration.

## Prerequisites

- ✅ Supabase project already configured
- ✅ OpenRouter API key (already configured!) OR OpenAI API key
- ✅ Node.js installed

## Setup Steps

### 1. Apply Database Migration

**Option A: Using Supabase CLI** (Recommended)

```bash
# If you have Supabase CLI installed
supabase db push
```

**Option B: Supabase Dashboard** (Manual)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of:
   ```
   supabase/migrations/20250119000000_create_ai_memories.sql
   ```
6. Click **Run** or press `Cmd/Ctrl + Enter`

**Option C: Using psql**

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/migrations/20250119000000_create_ai_memories.sql
```

### 2. Configure Environment Variables

**Option A: Use OpenRouter** (Recommended - already configured!)

```bash
# .env.local

# OpenRouter API Key (you already have this!)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Choose embedding model (defaults to openai/text-embedding-3-large)
# EMBEDDING_MODEL=openai/text-embedding-3-large

# Supabase (already configured - verify these exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Option B: Use OpenAI Directly**

```bash
# .env.local

# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Supabase (already configured - verify these exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Get OpenAI API Key (if not using OpenRouter):**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click **+ Create new secret key**
4. Copy the key and paste into `.env.local`

> **Note:** The integration automatically uses OpenRouter if `OPENROUTER_API_KEY` is set, otherwise falls back to OpenAI.

### 3. Install Dependencies (Already Done)

The required packages are already installed:
- ✅ `openai` - For generating embeddings (works with both OpenRouter and OpenAI)
- ✅ `@supabase/supabase-js` - For database operations

If you need to reinstall:
```bash
npm install
```

> **How it works:** The OpenAI SDK is used with a custom base URL when using OpenRouter, making it compatible with both providers.

### 4. Verify Migration

**Check in Supabase Dashboard:**

1. Go to **Database** → **Tables**
2. Look for `ai_memories` table
3. Should have columns: `id`, `user_id`, `content`, `embedding`, `metadata`, `chat_id`, `created_at`, `updated_at`

**Or run this SQL query:**

```sql
-- In Supabase SQL Editor
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ai_memories'
ORDER BY ordinal_position;
```

### 5. Test the Integration

**Start your development server:**

```bash
npm run dev
```

**Test memory storage and retrieval:**

1. Open your app in browser
2. Sign in (or create account)
3. Start a new chat
4. Say: **"I prefer email communication over phone calls"**
5. Wait for AI response (should acknowledge saving to memory)
6. Start a **different chat** (new conversation)
7. Ask: **"What's my preferred communication method?"**
8. AI should recall: **"You prefer email over phone"**

### 6. Verify in Database

**Check that memory was saved:**

```sql
-- In Supabase SQL Editor
SELECT
  id,
  user_id,
  content,
  created_at,
  (embedding IS NOT NULL) as has_embedding
FROM ai_memories
ORDER BY created_at DESC
LIMIT 10;
```

**Expected result:**
- You should see your test memory
- `has_embedding` should be `true`
- `user_id` should match your authenticated user

## Troubleshooting

### Issue: "AI Memory is not configured"

**Cause:** Neither OpenRouter nor OpenAI API key found

**Solution:**
```bash
# Check if either key is set
echo $OPENROUTER_API_KEY
echo $OPENAI_API_KEY

# Restart dev server after adding key
npm run dev
```

### Issue: "relation 'ai_memories' does not exist"

**Cause:** Migration not applied

**Solution:**
1. Apply migration (see Step 1 above)
2. Refresh database schema
3. Restart application

### Issue: "vector type does not exist"

**Cause:** pgvector extension not enabled

**Solution:**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
```

### Issue: "permission denied for table ai_memories"

**Cause:** Row-level security not configured

**Solution:**
- Ensure you're signed in
- Check RLS policies in migration file
- Verify `user_id` matches `auth.uid()`

### Issue: Embeddings not generating

**Cause:** OpenAI API rate limit or invalid key

**Solution:**
1. Verify API key is correct
2. Check OpenAI account has credits
3. Check server logs for errors
4. Try with lower usage limits

## Configuration Options

### Adjust Search Threshold

Edit in your chat to change sensitivity:

```typescript
// Lower = more results (less strict)
searchMemories({ query: "preferences", threshold: 0.6 })

// Higher = fewer results (more strict)
searchMemories({ query: "preferences", threshold: 0.8 })

// Default: 0.7 (balanced)
```

### Adjust Memory Limit

```typescript
// Fewer memories for faster responses
searchMemories({ query: "user info", limit: 3 })

// More memories for better context
searchMemories({ query: "user info", limit: 10 })

// Default: 5 (optimal)
```

### Customize System Prompt

Edit memory instructions in [app/api/chat/route.ts](app/api/chat/route.ts):

```typescript
// Lines 114-127
if (isAIMemoryEnabled() && isAuthenticated) {
  effectiveSystemPrompt += `
    // Customize these instructions
  `;
}
```

## Performance Tuning

### HNSW Index Parameters

For very large datasets (100K+ memories), tune HNSW index:

```sql
-- Drop existing index
DROP INDEX ai_memories_embedding_idx;

-- Create with custom parameters
CREATE INDEX ai_memories_embedding_idx ON ai_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (
    m = 32,              -- Higher = better recall, more memory
    ef_construction = 128 -- Higher = better quality, slower build
  );
```

### Embedding Model

To use a different model, edit [lib/ai-memory/index.ts](lib/ai-memory/index.ts):

```typescript
// Line 70
const response = await openai.embeddings.create({
  model: 'text-embedding-3-large', // Higher quality, 3072 dimensions
  input: text,
});

// Update migration SQL to match dimensions:
// embedding vector(3072)
```

## Cost Estimation

**Typical usage:**
- 1,000 memories/month
- 100 tokens avg per memory
- 100,000 total tokens/month

**Cost breakdown:**
- Embeddings: 100K tokens × $0.00002 = **$0.002/month**
- Database: Free tier or minimal
- **Total: ~$0.02/month** (vs. $10-50/month for Supermemory)

## Security Checklist

- ✅ Row-level security (RLS) enabled
- ✅ User isolation via foreign key
- ✅ API keys in environment variables
- ✅ HTTPS for all connections
- ✅ Supabase encryption at rest

## Next Steps

After setup:

1. **Monitor usage** - Check Supabase dashboard
2. **Review memories** - Audit what's being saved
3. **Tune parameters** - Adjust threshold/limit as needed
4. **Add metadata** - Enhance with custom tags
5. **Build UI** - Create memory management interface (optional)

## Resources

- [Full Documentation](./AI_MEMORY_INTEGRATION.md)
- [Migration Guide](./MIGRATION_GUIDE.md) (if coming from Supermemory)
- [Supabase Docs](https://supabase.com/docs/guides/ai)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

## Support

Need help?

- **Database issues**: [Supabase Discord](https://discord.supabase.com)
- **Code questions**: Create an issue in this repo
- **OpenAI API**: [OpenAI Support](https://help.openai.com)

---

**Setup complete?** Start chatting and watch the AI remember! 🧠✨
