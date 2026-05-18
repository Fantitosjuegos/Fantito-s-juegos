// Lightweight player name source for Luck tools.
// Reads any saved player names from localStorage so tools can auto-fill.

const KEY = 'fantito:lastPlayers';

export function saveLuckPlayers(names: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(names.filter(Boolean)));
  } catch {
    // ignore
  }
}

export function loadLuckPlayers(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0) : [];
  } catch {
    return [];
  }
}
