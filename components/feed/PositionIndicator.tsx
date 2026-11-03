"use client";

import { fmt } from "@/lib/i18n";
import { useDict } from "@/lib/store";

/** Small vertical "24 / 150" pill on the right edge of the feed. */
export function PositionIndicator({ index, total }: { index: number; total: number }) {
  const d = useDict();
  const pct = total > 1 ? index / (total - 1) : 1;
  return (
    <div
      className="pointer-events-none absolute top-1/2 right-1 z-10 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-line bg-surface/70 px-1 py-2 font-mono text-[10px] leading-none font-semibold tabular shadow-sm backdrop-blur-md"
      aria-live="polite"
      aria-label={fmt(d.feed.position, { i: index + 1, n: total })}
    >
      <span>{index + 1}</span>
      <span className="relative h-10 w-[3px] overflow-hidden rounded-full bg-line" aria-hidden>
        <span
          className="absolute inset-x-0 top-0 rounded-full bg-fg transition-[height] duration-300"
          style={{ height: `${Math.max(8, pct * 100)}%` }}
        />
      </span>
      <span className="text-muted">{total}</span>
    </div>
  );
}
