"use client";

import { useMemo, useRef } from "react";
import { promoteFirst } from "@/lib/catalog";
import { PRICING, useBilling } from "@/lib/billing";
import { useDict } from "@/lib/store";
import type { Item } from "@/lib/types";
import { ProductTile } from "../ItemCard";
import { useViewportFade } from "./useViewportFade";

/**
 * Single-line horizontal product carousel.
 * - strictly one row (`flex-nowrap` + `overflow-x-auto`, scroll-snap x)
 * - first PRICING.promotedSlots tiles are sponsored/boosted paid placements
 * - progressive edge mask + per-tile fade/blur as tiles enter/leave
 * Native: SwiftUI ScrollView(.horizontal) / Compose LazyRow.
 */
export function ProductRow({ items }: { items: Item[] }) {
  const d = useDict();
  const boosts = useBilling((s) => s.boosts);
  const isBoosted = useBilling((s) => s.isBoosted);
  const rowRef = useRef<HTMLDivElement>(null);

  const ordered = useMemo(() => promoteFirst(items, isBoosted, PRICING.promotedSlots).slice(0, 24), [items, isBoosted, boosts]); // eslint-disable-line react-hooks/exhaustive-deps
  useViewportFade(rowRef, [ordered]);

  if (ordered.length === 0) return null;

  return (
    <section aria-label={d.mono.products} className="border-b border-line py-3">
      <div className="mb-2 flex items-baseline justify-between px-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{d.mono.products}</h2>
        <span className="font-mono text-[10px] text-muted tabular">{ordered.length}</span>
      </div>
      <div ref={rowRef} className="no-scrollbar edge-mask-x flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-3 px-3">
        {ordered.map((it, i) => {
          const promoted = i < PRICING.promotedSlots && (isBoosted(it.id) ? "boost" : it.sponsored ? "ad" : undefined);
          return (
            <div key={it.id} data-fade className="fade-blur snap-start">
              <ProductTile item={it} promoted={promoted || undefined} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
