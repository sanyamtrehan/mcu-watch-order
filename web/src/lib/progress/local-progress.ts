export const LOCAL_PROGRESS_KEY = "mcu-watch-order:progress";
export const LOCAL_PROGRESS_EVENT = "mcu-watch-order:progress-updated";

export type LocalProgress = {
  version: 1;
  watchedUnitIds: string[];
  updatedAt: string;
};

const EMPTY_PROGRESS: LocalProgress = {
  version: 1,
  watchedUnitIds: [],
  updatedAt: new Date(0).toISOString(),
};

export function readLocalProgress(validUnitIds: Set<string>): LocalProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;

  return parseLocalProgress(window.localStorage.getItem(LOCAL_PROGRESS_KEY), validUnitIds);
}

export function parseLocalProgress(value: string | null, validUnitIds: Set<string>): LocalProgress {
  try {
    if (!value) return EMPTY_PROGRESS;

    const parsed = JSON.parse(value) as Partial<LocalProgress>;
    if (parsed.version !== 1 || !Array.isArray(parsed.watchedUnitIds)) return EMPTY_PROGRESS;

    return {
      version: 1,
      watchedUnitIds: [...new Set(parsed.watchedUnitIds.filter((id): id is string => typeof id === "string" && validUnitIds.has(id)))],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : EMPTY_PROGRESS.updatedAt,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function writeLocalProgress(watchedUnitIds: Iterable<string>): LocalProgress {
  const progress: LocalProgress = {
    version: 1,
    watchedUnitIds: [...new Set(watchedUnitIds)],
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event(LOCAL_PROGRESS_EVENT));
  return progress;
}
