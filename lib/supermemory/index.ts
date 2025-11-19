/**
 * Supermemory Integration Module
 *
 * This module provides utilities for integrating Supermemory's long-term memory
 * capabilities into the chat system, allowing the LLM to remember conversations
 * from other chats and provide more personalized responses.
 */

import { tool } from 'ai';
import { z } from 'zod';
import Supermemory from 'supermemory';

/**
 * Configuration for Supermemory
 */
export interface SupermemoryConfig {
  apiKey: string;
  enabled?: boolean;
}

/**
 * Get Supermemory configuration from environment
 */
export function getSupermemoryConfig(): SupermemoryConfig {
  const apiKey = process.env.SUPERMEMORY_API_KEY || '';
  const enabled = !!apiKey && apiKey !== 'your_supermemory_api_key';

  return {
    apiKey,
    enabled,
  };
}

/**
 * Get Supermemory tools for use in AI SDK
 *
 * @param userId - User ID to scope memories to a specific user
 * @param chatId - Optional chat ID for additional context isolation
 * @returns Supermemory tools object or null if not configured
 */
export function getSupermemoryTools(userId: string, chatId?: string) {
  const config = getSupermemoryConfig();

  if (!config.enabled) {
    console.warn('Supermemory is not configured. Skipping memory integration.');
    return null;
  }

  try {
    // Initialize Supermemory client
    const client = new Supermemory({
      apiKey: config.apiKey,
    });

    // Create container tag for user isolation
    const containerTag = `user:${userId}`;

    // Create native AI SDK tools using the official SDK
    return {
      searchMemories: tool({
        description: 'Search for relevant information from previous conversations and user memories. Use this to recall context, preferences, or past interactions.',
        parameters: z.object({
          query: z.string().describe('What information to search for in the user\'s memory'),
          limit: z.number().optional().default(5).describe('Maximum number of memories to return'),
        }),
        execute: async ({ query, limit }) => {
          try {
            const response = await client.search.memories({
              q: query,
              limit: limit || 5,
              containerTag,
            });

            return {
              success: true,
              memories: response.results.map(r => ({
                id: r.id,
                content: r.memory,
                similarity: r.similarity,
                metadata: r.metadata,
                updatedAt: r.updatedAt,
              })),
              count: response.total,
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
        description: 'Save important information to long-term memory. Use this when the user shares preferences, goals, experiences, or other details worth remembering.',
        parameters: z.object({
          content: z.string().describe('The information to remember. Can include a title/summary followed by detailed content.'),
        }),
        execute: async ({ content }) => {
          try {
            const response = await client.memories.add({
              content,
              containerTag,
            });

            return {
              success: true,
              memoryId: response.id,
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
    console.error('Error initializing Supermemory tools:', error);
    return null;
  }
}

/**
 * Check if Supermemory is enabled
 */
export function isSupermemoryEnabled(): boolean {
  const config = getSupermemoryConfig();
  return config.enabled ?? false;
}

/**
 * Format memory context for inclusion in system prompt
 *
 * This is useful when using the Infinite Chat method instead of tools.
 * For now, we're using the tools approach, but this can be extended later.
 */
export function formatMemoryContext(memories: string[]): string {
  if (!memories || memories.length === 0) {
    return '';
  }

  return `# Conversation Memory

The following information has been remembered from previous conversations:

${memories.map((memory, idx) => `${idx + 1}. ${memory}`).join('\n')}

Use this context to provide more personalized and context-aware responses.
`;
}
