import { useCallback, useEffect, useRef, useState } from "react";

export interface PollState<T> {
  data: T | null;
  error: string | null;
  updatedAt: number | null;
  loading: boolean;
  refresh: () => void;
}

/**
 * Polls `fetcher` every `intervalMs`. Errors keep the previous data visible
 * and are surfaced separately, so a transient API hiccup never blanks the UI.
 */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs: number): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const tick = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatedAt(Date.now());
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void tick();
  }, [tick]);

  useEffect(() => {
    let cancelled = false;
    const guardedTick = () => {
      if (!cancelled) void tick();
    };
    guardedTick();
    const timer = window.setInterval(guardedTick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tick, intervalMs]);

  return { data, error, updatedAt, loading, refresh };
}
