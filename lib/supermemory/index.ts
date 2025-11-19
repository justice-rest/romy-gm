/**
 * Supermemory Integration Module
 *
 * This module provides utilities for integrating Supermemory's long-term memory
 * capabilities into the chat system, allowing the LLM to remember conversations
 * from other chats and provide more personalized responses.
 */

import { supermemoryTools } from '@supermemory/tools/ai-sdk';

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
    // Create container tags to isolate memories per user and optionally per chat
    const containerTags = [
      `user:${userId}`,
      ...(chatId ? [`chat:${chatId}`] : []),
    ];

    // Initialize Supermemory tools with configuration
    const tools = supermemoryTools(config.apiKey, {
      // Use container tags to scope memories to the user
      // This ensures each user's memories are isolated
      containerTags,
    });

    return tools;
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
