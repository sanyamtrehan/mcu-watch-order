export const LOCAL_WATCH_HISTORY_KEY = "mcu-watch-order:history";
export const LOCAL_WATCH_HISTORY_EVENT = "mcu-watch-order:history-updated";

export type WatchHistoryEntry = {
  id: string;
  watchUnitId: string;
  action: "watched" | "unwatched";
  occurredAt: string;
};

export function parseLocalWatchHistory(value: string | null, validUnitIds: Set<string>): WatchHistoryEntry[] {
  try {
    const parsed = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is WatchHistoryEntry =>
      typeof entry?.id === "string" &&
      typeof entry?.watchUnitId === "string" && validUnitIds.has(entry.watchUnitId) &&
      (entry?.action === "watched" || entry?.action === "unwatched") &&
      typeof entry?.occurredAt === "string" && !Number.isNaN(Date.parse(entry.occurredAt)),
    ).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  } catch {
    return [];
  }
}

export function appendLocalWatchHistory(watchUnitIds: Iterable<string>, action: WatchHistoryEntry["action"], validUnitIds: Set<string>) {
  const occurredAt = new Date().toISOString();
  const entries = [...new Set(watchUnitIds)].filter((id) => validUnitIds.has(id)).map((watchUnitId) => ({
    id: crypto.randomUUID(),
    watchUnitId,
    action,
    occurredAt,
  } satisfies WatchHistoryEntry));
  const current = parseLocalWatchHistory(window.localStorage.getItem(LOCAL_WATCH_HISTORY_KEY), validUnitIds);
  window.localStorage.setItem(LOCAL_WATCH_HISTORY_KEY, JSON.stringify([...entries, ...current]));
  window.dispatchEvent(new Event(LOCAL_WATCH_HISTORY_EVENT));
  return entries;
}
