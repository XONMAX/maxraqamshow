"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Item } from "@/lib/types";
import { CompactCard } from "../ItemCard";
import { EndCard, LoaderCard } from "./FeedExtras";
import { PositionIndicator } from "./PositionIndicator";
import { useIntro, usePaged } from "./usePaged";

const ROW = 112; // 100px card + 12px gap

/** Compact list: 4–6 cards per screen, entering cards fade/rise in, leaving cards fade/shrink out. */
export function ListFeed({ items }: { items: Item[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { loaded, hasMore, ensure } = usePaged(items.length, 12);
  const count = loaded + 1;
  const reduce = useReducedMotion();
  const intro = useIntro();

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW,
    overscan: 3,
    paddingStart: 8,
    paddingEnd: 16,
  });

  const [first, setFirst] = useState(0);
  const range = virtualizer.range;
  const lastVisible = range?.endIndex ?? 0;
  useEffect(() => ensure(lastVisible), [lastVisible, ensure]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setFirst(Math.max(0, Math.round((el.scrollTop - 8) / ROW)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 };
  const shown = reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 };

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} className="no-scrollbar h-full snap-y snap-proximity overflow-y-auto overscroll-contain">
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const item = items[vi.index];
            return (
              <div
                key={vi.key}
                className="absolute inset-x-0 snap-start pr-9 pl-3"
                style={{ top: vi.start, height: ROW - 12 }}
              >
                <motion.div
                  className="h-full"
                  initial={hidden}
                  whileInView={shown}
                  viewport={{ root: scrollRef, amount: 0.25 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: intro.current ? Math.min(vi.index, 8) * 0.04 : 0,
                  }}
                >
                  {item ? <CompactCard item={item} /> : hasMore ? <LoaderCard compact /> : <EndCard compact />}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      {items.length > 0 && <PositionIndicator index={Math.min(first, items.length - 1)} total={items.length} />}
    </div>
  );
}
