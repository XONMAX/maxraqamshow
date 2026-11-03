"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Item } from "@/lib/types";
import { ItemCard } from "../ItemCard";
import { EndCard, LoaderCard } from "./FeedExtras";
import { PositionIndicator } from "./PositionIndicator";
import { useIntro, usePaged } from "./usePaged";

/** Fraction of the viewport each card occupies; the rest lets neighbours peek above/below. */
const CARD_RATIO = 0.9;

/**
 * Full-screen, Reels-style feed:
 *  - CSS scroll-snap (y mandatory), one card per screen
 *  - TanStack Virtual keeps ~10 cards in the DOM
 *  - scroll-linked fade/scale/blur driven by a single MotionValue (no React re-render per frame)
 */
export function ReelsFeed({ items }: { items: Item[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const el = scrollRef.current!;
    setH(el.clientHeight);
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = Math.max(1, Math.round(h * CARD_RATIO));
  const pad = Math.max(0, Math.floor((h - size) / 2));

  const { loaded, hasMore, ensure } = usePaged(items.length);
  const count = loaded + 1; // + trailing loader / end-of-feed card

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => size,
    overscan: 4,
    paddingStart: pad,
    paddingEnd: pad,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [size, pad, virtualizer]);

  const scrollY = useMotionValue(0);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const snapped = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || size <= 1) return;
    let settle: ReturnType<typeof setTimeout> | undefined;

    const onSnap = () => {
      const idx = Math.round(el.scrollTop / size);
      if (idx !== snapped.current) {
        snapped.current = idx;
        navigator.vibrate?.(10); // light haptic tick when a card locks in
      }
    };
    const onScroll = () => {
      scrollY.set(el.scrollTop);
      const idx = Math.min(count - 1, Math.max(0, Math.round(el.scrollTop / size)));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
      if (!("onscrollend" in window)) {
        clearTimeout(settle);
        settle = setTimeout(onSnap, 120);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onSnap);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onSnap);
      clearTimeout(settle);
    };
  }, [size, count, scrollY]);

  useEffect(() => ensure(active), [active, ensure]);

  const intro = useIntro();

  // Keyboard: arrow keys / PageUp/Down move one card.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const dir = e.key === "ArrowDown" || e.key === "PageDown" ? 1 : e.key === "ArrowUp" || e.key === "PageUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    el.scrollTo({ top: (activeRef.current + dir) * size, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none"
      >
        {h > 0 && (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const item = items[vi.index];
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  className="absolute inset-x-0 snap-center snap-always px-3 py-1.5"
                  style={{ top: vi.start, height: size }}
                >
                  <ReelSlot index={vi.index} size={size} scrollY={scrollY} intro={intro.current}>
                    {item ? <ItemCard item={item} /> : hasMore ? <LoaderCard /> : <EndCard />}
                  </ReelSlot>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {items.length > 0 && <PositionIndicator index={Math.min(active, items.length - 1)} total={items.length} />}
    </div>
  );
}

function ReelSlot({
  index,
  size,
  scrollY,
  intro,
  children,
}: {
  index: number;
  size: number;
  scrollY: MotionValue<number>;
  intro: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const c = index * size; // scrollTop at which this card is centred

  // Entering/leaving: 0 → 0.4 (neighbour, dimmed) → 1 (active) → 0.4 → 0
  const opacity = useTransform(scrollY, [c - 1.5 * size, c - size, c, c + size, c + 1.5 * size], [0, 0.4, 1, 0.4, 0]);
  const scale = useTransform(scrollY, [c - size, c, c + size], [0.96, 1, 0.96]);
  const y = useTransform(scrollY, [c - size, c], [24, 0]); // rises 24px → 0 as it enters from below
  const blurPx = useTransform(scrollY, [c - size, c, c + size], [2, 0, 2]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.div
      className="h-full"
      initial={intro ? { opacity: 0, y: reduce ? 0 : 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: intro ? Math.min(index, 6) * 0.04 : 0 }}
    >
      <motion.div
        className="h-full will-change-transform"
        style={reduce ? { opacity } : { opacity, scale, y, filter }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
