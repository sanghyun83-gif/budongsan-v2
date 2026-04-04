export function loadIdSet(key: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0));
  } catch {
    return new Set();
  }
}

export function saveIdSet(key: string, ids: Set<number>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(ids).sort((a, b) => a - b)));
}

export function hasStoredId(key: string, id: number): boolean {
  return loadIdSet(key).has(id);
}

export function toggleStoredId(key: string, id: number): boolean {
  const next = loadIdSet(key);
  if (next.has(id)) {
    next.delete(id);
    saveIdSet(key, next);
    return false;
  }

  next.add(id);
  saveIdSet(key, next);
  return true;
}
