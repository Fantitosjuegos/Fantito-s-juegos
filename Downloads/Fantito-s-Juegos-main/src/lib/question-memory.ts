/**
 * question-memory.ts
 * ------------------
 * Rolling memory of the last 200 questions served to the user.
 * Sent to the AI as `avoidQuestions` so cards don't repeat across sessions.
 * Uses the platform-aware storage abstraction instead of localStorage directly.
 */
import { storage } from '@/lib/storage';

const KEY = 'fantitos.recentQuestions.v1';
const MAX = 200;

export async function loadRecentQuestions(): Promise<string[]> {
  const arr = await storage.getJSON<unknown[]>(KEY);
  if (!Array.isArray(arr)) return [];
  return arr.filter((s): s is string => typeof s === 'string');
}

export async function rememberQuestions(qs: string[]): Promise<void> {
  const cleaned = qs.map(q => (q || '').trim()).filter(Boolean);
  if (!cleaned.length) return;

  const existing = await loadRecentQuestions();
  const merged   = [...cleaned, ...existing];
  const seen     = new Set<string>();
  const dedup: string[] = [];

  for (const q of merged) {
    const k = q.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(q);
    if (dedup.length >= MAX) break;
  }

  await storage.setJSON(KEY, dedup);
}