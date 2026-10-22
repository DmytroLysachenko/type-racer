const DEFAULT_INTERVAL_MS = 1000;

/** Keep a misconfigured client from flooding Pusher or making peers feel stale. */
export function parseProgressInterval(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return DEFAULT_INTERVAL_MS;
  const interval = Number(value);
  return Number.isSafeInteger(interval) && interval >= 250 && interval <= 10000
    ? interval
    : DEFAULT_INTERVAL_MS;
}

export const PROGRESS_INTERVAL_MS = parseProgressInterval(
  process.env.NEXT_PUBLIC_PROGRESS_INTERVAL_MS,
);
