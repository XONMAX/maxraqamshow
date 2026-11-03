"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Infinite-scroll pagination over an already-sorted list.
 * Simulates network latency so the loader card is visible; swap `setTimeout` for a fetch in production.
 */
export function usePaged(total: number, pageSize = 10, latency = 450) {
  const [loaded, setLoaded] = useState(() => Math.min(pageSize, total));
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const ensure = useCallback(
    (index: number) => {
      if (loading || loaded >= total || index < loaded - 3) return;
      setLoading(true);
      timer.current = setTimeout(() => {
        setLoaded((l) => Math.min(total, l + pageSize));
        setLoading(false);
      }, latency);
    },
    [loading, loaded, total, pageSize, latency],
  );

  return { loaded, loading, hasMore: loaded < total, ensure };
}

/** True for the first ~700ms after mount — cards mounted in that window get the staggered intro. */
export function useIntro(ms = 700) {
  const intro = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => (intro.current = false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return intro;
}
