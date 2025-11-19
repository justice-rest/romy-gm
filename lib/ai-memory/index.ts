/**
 * AI Memory Integration Module (Supabase + pgvector)
 *
 * This module provides utilities for integrating AI memory capabilities using
 * Supabase's pgvector extension, allowing the LLM to remember conversations
 * and provide more personalized responses through semantic search.
 *
 * Architecture:
 * - Uses OpenRouter's embedding API for generating 1536-dim vectors
 * - Supports multiple embedding models (OpenAI, Qwen, etc.)
 * - Stores embeddings in Supabase PostgreSQL with pgvector extension
 * - Performs semantic similarity search using cosine distance
 * - Provides user isolation through user_id foreign key constraints
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClientType } from '@/app/types/api.types';
import OpenAI from 'openai';

/**
 * Configuration for AI Memory
 */
export interface AIMemoryConfig {
  enabled: boolean;
  embeddingApiKey?: string;
  embeddingModel?: string;
  useOpenRouter?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Get AI Memory configuration from environment
 */
export function getAIMemoryConfig(): AIMemoryConfig {
  // Check for OpenRouter API key first (preferred), fallback to OpenAI
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const embeddingApiKey = openrouterApiKey || openaiApiKey;
  const useOpenRouter = !!openrouterApiKey;

  // Default embedding model based on provider
  const embeddingModel = useOpenRouter
    ? (process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-large')
    : 'text-embedding-3-small';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const enabled = !!(embeddingApiKey && supabaseUrl && supabaseKey);

  return {
    enabled,
    embeddingApiKey,
    embeddingModel,
    useOpenRouter,
    supabaseUrl,
    supabaseKey,
  };
}

/**
 * Check if AI Memory is enabled
 */
export function isAIMemoryEnabled(): boolean {
  const config = getAIMemoryConfig();
  return config.enabled;
}

/**
 * Generate embedding vector for text using OpenRouter or OpenAI
 *
 * OpenRouter provides access to multiple embedding models through an OpenAI-compatible API.
 * This function automatically uses OpenRouter if OPENROUTER_API_KEY is set, otherwise falls back to OpenAI.
 */
async function generateEmbedding(
  text: string,
  apiKey: string,
  model: string = 'openai/text-embedding-3-large',
  useOpenRouter: boolean = false
): Promise<number[]> {
  // Initialize OpenAI SDK with OpenRouter endpoint if using OpenRouter
  const client = new OpenAI({
    apiKey,
    baseURL: useOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    defaultHeaders: useOpenRouter ? {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'AI Memory',
    } : undefined,
  });

  const response = await client.embeddings.create({
    model,
    input: text,
    encoding_format: 'float',
    dimensions: 1536, // Explicitly request 1536 dimensions to match database schema
  });

  return response.data[0].embedding;
}

/**
 * Memory search result type
 */
export interface MemorySearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
  chatId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get AI Memory tools for use in AI SDK
 *
 * @param userId - User ID to scope memories to a specific user
 * @param supabase - Authenticated Supabase client with user session
 * @param chatId - Optional chat ID for additional context
 * @returns AI Memory tools object or null if not configured
 */
export function getAIMemoryTools(userId: string, supabase: SupabaseClientType, chatId?: string) {
  const config = getAIMemoryConfig();

  if (!config.enabled) {
    console.warn('AI Memory is not configured. Skipping memory integration.');
    return null;
  }

  try {

    // Create native AI SDK tools
    return {
      searchMemories: tool({
        description: 'Search for relevant information from previous conversations and user memories. Use this to recall context, preferences, or past interactions with semantic understanding.',
        parameters: z.object({
          query: z.string().describe('What information to search for in the user\'s memory'),
          limit: z.number().optional().default(5).describe('Maximum number of memories to return (1-10)'),
          threshold: z.number().optional().default(0.7).describe('Minimum similarity threshold (0-1, higher = more similar)'),
        }),
        execute: async ({ query, limit = 5, threshold = 0.7 }) => {
          try {
            // Generate embedding for the search query using configured provider (OpenRouter or OpenAI)
            const queryEmbedding = await generateEmbedding(
              query,
              config.embeddingApiKey!,
              config.embeddingModel!,
              config.useOpenRouter
            );

            // Call the match_ai_memories function
            const { data, error } = await supabase.rpc('match_ai_memories', {
              query_embedding: queryEmbedding,
              query_user_id: userId,
              match_threshold: threshold,
              match_count: Math.min(limit, 10),
            });

            if (error) {
              console.error('Error searching memories:', error);
              return {
                success: false,
                error: error.message,
                memories: [],
                count: 0,
              };
            }

            const memories: MemorySearchResult[] = (data || []).map((row: any) => ({
              id: row.id,
              content: row.content,
              similarity: row.similarity,
              metadata: row.metadata,
              chatId: row.chat_id,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));

            return {
              success: true,
              memories,
              count: memories.length,
            };
          } catch (error) {
            console.error('Error searching memories:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              memories: [],
              count: 0,
            };
          }
        },
      }),

      addMemory: tool({
        description: 'Save important information to long-term memory. Use this when the user shares preferences, goals, experiences, organization details, or other meaningful context worth remembering for future conversations.',
        parameters: z.object({
          content: z.string().describe('The information to remember. Be specific and include relevant context.'),
          metadata: z.record(z.any()).optional().describe('Optional metadata (e.g., {importance: "high", category: "preference"})'),
        }),
        execute: async ({ content, metadata = {} }) => {
          try {
            // Generate embedding for the memory content using configured provider (OpenRouter or OpenAI)
            const embedding = await generateEmbedding(
              content,
              config.embeddingApiKey!,
              config.embeddingModel!,
              config.useOpenRouter
            );

            // Insert the memory into the database
            const { data, error } = await supabase
              .from('ai_memories')
              .insert({
                user_id: userId,
                content,
                embedding: embedding as any, // pgvector handles the array conversion
                metadata: metadata as any,
                chat_id: chatId,
              })
              .select('id')
              .single();

            if (error) {
              console.error('Error adding memory:', error);
              return {
                success: false,
                error: error.message,
              };
            }

            return {
              success: true,
              memoryId: data.id,
              message: 'Memory saved successfully',
            };
          } catch (error) {
            console.error('Error adding memory:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
      }),
    };
  } catch (error) {
    console.error('Error initializing AI Memory tools:', error);
    return null;
  }
}

/**
 * Format memory context for inclusion in system prompt
 *
 * This is useful when using manual memory retrieval instead of tools.
 */
export function formatMemoryContext(memories: MemorySearchResult[]): string {
  if (!memories || memories.length === 0) {
    return '';
  }

  return `# User Memory Context

The following information has been remembered from previous conversations:

${memories.map((memory, idx) => `${idx + 1}. ${memory.content} (relevance: ${(memory.similarity * 100).toFixed(1)}%)`).join('\n')}

Use this context to provide more personalized and context-aware responses.
`;
}

/**
 * Batch delete memories by IDs
 * Useful for memory management and cleanup
 */
export async function deleteMemories(
  memoryIds: string[],
  userId: string,
  supabase: SupabaseClientType
): Promise<boolean> {
  const config = getAIMemoryConfig();

  if (!config.enabled) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('ai_memories')
      .delete()
      .in('id', memoryIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting memories:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting memories:', error);
    return false;
  }
}

/**
 * Get all memories for a user
 * Useful for memory management UI
 */
export async function getUserMemories(
  userId: string,
  supabase: SupabaseClientType,
  limit: number = 50,
  offset: number = 0
): Promise<MemorySearchResult[]> {
  const config = getAIMemoryConfig();

  if (!config.enabled) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('ai_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching memories:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      similarity: 1.0, // Not applicable for direct fetch
      metadata: row.metadata as Record<string, any>,
      chatId: row.chat_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
}
