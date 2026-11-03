"use client";

import { memo } from "react";
import { Heart } from "lucide-react";
import { TypeBadge } from "@/lib/meta";
import { useItemActions } from "@/lib/actions";
import { useBilling } from "@/lib/billing";
import { useDict } from "@/lib/store";
import { formatUSD } from "@/lib/format";
import type { Item } from "@/lib/types";
import { LockedBlur } from "./monetization/LockedBlur";
import { BoostButton } from "./monetization/BoostButton";
import { ItemBadges, ItemValue, Pill, Rating } from "./ui";

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

function useOpen(itemId: string) {
  const { open } = useItemActions(itemId);
  return {
    onClick: open,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        open();
      }
    },
  };
}

/**
 * Compact post row — 56px tall, 12px horizontal padding, 1px divider below.
 * Layout: [icon 28] [value / meta] [price / ♡]
 */
export const PostRow = memo(function PostRow({ item }: { item: Item }) {
  const d = useDict();
  const { saved, toggleSave } = useItemActions(item.id);
  const locked = !useBilling((s) => s.canSee(item.id, item.premium));
  const open = useOpen(item.id);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${item.value}. ${d.card.open}`}
      {...open}
      className="flex h-14 cursor-pointer items-center gap-3 border-b border-line px-3 active:bg-surface-2"
    >
      <TypeBadge type={item.type} size={28} />
      <div className="min-w-0 flex-1">
        <LockedBlur itemId={item.id} locked={locked} compact>
          <p className="truncate leading-[18px]">
            <ItemValue item={item} size="sm" />
          </p>
        </LockedBlur>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-[14px] text-muted">
          <ItemBadges item={item} />
          <span aria-hidden>·</span>
          <Rating value={item.seller.rating} />
        </p>
      </div>
      <div className="flex items-center gap-1">
        {item.mine ? <BoostButton itemId={item.id} /> : null}
        <span className="font-mono text-[13px] font-semibold tabular">{formatUSD(item.priceUSD)}</span>
        <button
          type="button"
          onClick={stop(toggleSave)}
          aria-pressed={saved}
          aria-label={saved ? d.card.saved : d.card.save}
          className="-mr-2 flex h-11 w-9 items-center justify-center"
        >
          <Heart size={15} className={saved ? "fill-current" : "text-muted"} />
        </button>
      </div>
    </article>
  );
});

/**
 * Product tile for the single-line carousel — 132×116, 1px border, 8px padding.
 * Promoted tiles get a solid border and an [AD] / [BOOSTED] pill.
 */
export const ProductTile = memo(function ProductTile({ item, promoted }: { item: Item; promoted?: "ad" | "boost" }) {
  const d = useDict();
  const locked = !useBilling((s) => s.canSee(item.id, item.premium));
  const open = useOpen(item.id);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${item.value}. ${d.card.open}`}
      {...open}
      className={`flex h-[116px] w-[132px] shrink-0 cursor-pointer flex-col justify-between rounded-lg border bg-surface p-2 active:bg-surface-2 ${
        promoted ? "border-fg" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between">
        <TypeBadge type={item.type} size={22} />
        {promoted ? <Pill solid={promoted === "boost"}>{promoted === "ad" ? d.mono.ad : d.mono.boosted}</Pill> : item.premium ? <Pill solid>{d.mono.pro}</Pill> : null}
      </div>
      <LockedBlur itemId={item.id} locked={locked} compact>
        <p className="truncate leading-tight">
          <ItemValue item={item} size="sm" />
        </p>
      </LockedBlur>
      <div className="flex items-end justify-between">
        <span className="truncate text-[10px] text-muted">{d.cats[item.category]}</span>
        <span className="font-mono text-[12px] font-semibold tabular">{formatUSD(item.priceUSD)}</span>
      </div>
    </article>
  );
});
