/**
 * Generate a DiceBear avatar URL using the Dylan style
 * @param seed - Unique identifier for consistent avatar generation (e.g., user ID or email)
 * @returns DiceBear avatar URL
 */
export function generateDiceBearAvatar(seed: string): string {
  const encodedSeed = encodeURIComponent(seed)
  return `https://api.dicebear.com/9.x/dylan/svg?seed=${encodedSeed}`
}
