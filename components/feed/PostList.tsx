"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Item } from "@/lib/types";
import { PostRow } from "../ItemCard";
import { useViewportFade } from "./useViewportFade";
import { usePaged } from "./usePaged";
import { EndRow, LoaderRow } from "./FeedExtras";

const ROW = 56; // compact post height (incl. 1px divider)

/** Dense virtualized list of compact posts with viewport fade/blur. `header` scrolls with the list. */
export function PostList({ items, header }: { items: Item[]; header?: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { loaded, hasMore, ensure } = usePaged(items.length, 20, 300);
  const count = loaded + 1;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW,
    overscan: 6,
    scrollMargin: headerRef.current?.offsetHeight ?? 0,
  });

  const last = virtualizer.range?.endIndex ?? 0;
  useEffect(() => ensure(last), [last, ensure]);
  useViewportFade(scrollRef, [items]);

  return (
    <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div ref={headerRef}>{header}</div>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const item = items[vi.index];
          return (
            <div
              key={vi.key}
              data-fade
              className="fade-blur absolute inset-x-0"
              style={{ top: vi.start - virtualizer.options.scrollMargin, height: ROW }}
            >
              {item ? <PostRow item={item} /> : hasMore ? <LoaderRow /> : <EndRow />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
