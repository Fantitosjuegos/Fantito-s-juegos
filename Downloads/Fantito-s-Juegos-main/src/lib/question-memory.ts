/**
 * Persistent rolling memory of the last 200 questions the user has been served.
 * Sent to the AI as `avoidQuestions` so the same prompts don't reappear across sessions.
 */
const KEY = 'fantitos.recentQuestions.v1';
const MAX = 200;

export function loadRecentQuestions(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberQuestions(qs: string[]) {
  try {
    const cleaned = qs.map(q => (q || '').trim()).filter(Boolean);
    if (!cleaned.length) return;
    const existing = loadRecentQuestions();
    const merged = [...cleaned, ...existing];
    const seen = new Set<string>();
    const dedup: string[] = [];
    for (const q of merged) {
      const k = q.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      dedup.push(q);
      if (dedup.length >= MAX) break;
    }
    localStorage.setItem(KEY, JSON.stringify(dedup));
  } catch {
    /* ignore quota errors */
  }
}
