"use client";

import { useEffect, type RefObject } from "react";

/**
 * Fade + blur cards as they enter/leave the viewport.
 *
 * One IntersectionObserver per scroll container; it writes `data-vis` on each
 * `[data-fade]` child and CSS (`.fade-blur`) animates opacity/filter. No React state
 * changes per scroll frame, so lists stay at 60fps.
 *
 *   ratio < 0.15  → "out"  (opacity 0, blur 6px)
 *   ratio < 0.6   → "edge" (opacity .45, blur 2px)   — progressive edge blur
 *   otherwise     → "in"
 *
 * Native equivalent: SwiftUI `.opacity()/.blur()` driven by GeometryReader minY,
 * Compose `graphicsLayer { alpha }` + `Modifier.blur()` from LazyListState offsets.
 */
export function useViewportFade(root: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const r = e.intersectionRatio;
          (e.target as HTMLElement).dataset.vis = r < 0.15 ? "out" : r < 0.6 ? "edge" : "in";
        }
      },
      { root: el, threshold: [0, 0.15, 0.6, 1] },
    );
    const observe = () => el.querySelectorAll<HTMLElement>("[data-fade]").forEach((n) => io.observe(n));
    observe();
    // Virtualized lists mount/unmount rows: re-scan on DOM changes.
    const mo = new MutationObserver(observe);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
