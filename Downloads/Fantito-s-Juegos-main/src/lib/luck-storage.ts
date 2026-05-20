/**
 * luck-storage.ts
 * ---------------
 * Persists the last-used player names so Luck tools can auto-fill them.
 * Uses the platform-aware storage abstraction instead of localStorage directly.
 */
import { storage } from '@/lib/storage';

const KEY = 'fantito:lastPlayers';

export async function saveLuckPlayers(names: string[]): Promise<void> {
  await storage.setJSON(KEY, names.filter(Boolean));
}

export async function loadLuckPlayers(): Promise<string[]> {
  const parsed = await storage.getJSON<unknown[]>(KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}