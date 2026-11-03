"use client";

import { memo } from "react";
import { Heart, Share2, ShoppingBag } from "lucide-react";
import { TYPE_META, TypeBadge } from "@/lib/meta";
import { useItemActions } from "@/lib/actions";
import { useApp, useDict, useUI } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { currency, formatUSD, formatUZSShort, group } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Avatar, ItemBadges, ItemValue, Rating, Verified } from "./ui";

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

function useOpen(item: Item) {
  const openSheet = useUI((s) => s.openSheet);
  return {
    onClick: () => openSheet(item.id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openSheet(item.id);
      }
    },
  };
}

/** Big card used in the full-screen (reels) feed. */
export const ItemCard = memo(function ItemCard({ item }: { item: Item }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const m = TYPE_META[item.type];
  const { saved, toggleSave, share, buy } = useItemActions(item);
  const open = useOpen(item);
  const len = item.value.replace(/^@/, "").length;
  const sub = item.type === "phone" ? d.card.digits : fmt(d.card.chars, { n: len });

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${item.value}. ${d.card.open}`}
      {...open}
      className="relative h-full cursor-pointer rounded-[28px] p-px outline-offset-4"
      style={{
        background:
          item.type === "instagram"
            ? m.bg
            : `linear-gradient(160deg, ${m.accent} 0%, ${m.accent}55 30%, var(--line) 65%)`,
        boxShadow: `0 28px 60px -30px ${m.glow}, 0 0 0 1px ${m.accent}14`,
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[27px] bg-surface p-5">
        {/* accent glow + watermark (no CSS filters: cheap to composite while scrolling) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[130%] -translate-x-1/2 opacity-70"
          style={{ background: `radial-gradient(closest-side, ${m.glow}, transparent)` }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-12 opacity-[0.06]" style={{ color: m.accent }}>
          <m.Icon size={230} strokeWidth={1.5} />
        </div>

        <header className="relative flex items-center gap-2.5 pr-8">
          <TypeBadge type={item.type} size={40} />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-muted">{d.types[item.type]}</p>
            <ItemBadges item={item} />
          </div>
        </header>

        <div className="cq relative flex min-h-0 flex-1 flex-col items-center justify-center px-1 text-center">
          <ItemValue item={item} variant="hero" />
          <p className="mt-4 text-[13px] text-muted">{sub}</p>
        </div>

        <div className="relative">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[24px] leading-tight font-extrabold tabular">
                {group(item.priceUZS)}
                <span className="ml-1.5 font-sans text-[14px] font-semibold text-muted">{currency(lang)}</span>
              </p>
              <p className="font-mono text-[14px] text-muted tabular">≈ {formatUSD(item.priceUSD)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
            <Avatar name={item.seller.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{item.seller.name}</p>
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <Rating value={item.seller.rating} />
                <Verified item={item} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={stop(buy)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition active:scale-[0.98]"
              style={{ background: m.bg, boxShadow: `0 10px 24px -12px ${m.glow}` }}
            >
              <ShoppingBag size={18} aria-hidden />
              {d.card.buy}
            </button>
            <button
              type="button"
              onClick={stop(toggleSave)}
              aria-pressed={saved}
              aria-label={saved ? d.card.saved : d.card.save}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 transition active:scale-95"
            >
              <Heart size={20} className={saved ? "fill-rose-500 text-rose-500" : ""} />
            </button>
            <button
              type="button"
              onClick={stop(share)}
              aria-label={d.card.share}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 transition active:scale-95"
            >
              <Share2 size={19} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

/** Row card used in the compact list, search results and saved. */
export const CompactCard = memo(function CompactCard({ item, highlight }: { item: Item; highlight?: string }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const m = TYPE_META[item.type];
  const { saved, toggleSave } = useItemActions(item);
  const open = useOpen(item);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${item.value}. ${d.card.open}`}
      {...open}
      className="relative flex h-[100px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border bg-surface py-3 pr-1.5 pl-4 transition active:scale-[0.99]"
      style={{ borderColor: `${m.accent}30`, boxShadow: `0 12px 30px -24px ${m.glow}` }}
    >
      <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-r-full" style={{ background: m.bg }} />
      <TypeBadge type={item.type} size={42} />
      <div className="min-w-0 flex-1">
        <ItemBadges item={item} small />
        <p className="mt-1.5 truncate text-[19px] leading-tight">
          {highlight ? <Highlighted item={item} q={highlight} /> : <ItemValue item={item} variant="row" />}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
          <Rating value={item.seller.rating} />
          <span className="truncate">{item.seller.name}</span>
          <Verified item={item} label={false} />
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="font-mono text-[15px] font-bold tabular">{formatUSD(item.priceUSD)}</p>
        <p className="font-mono text-[11px] text-muted tabular">{formatUZSShort(item.priceUZS, lang)}</p>
        <button
          type="button"
          onClick={stop(toggleSave)}
          aria-pressed={saved}
          aria-label={saved ? d.card.saved : d.card.save}
          className="-mb-2 flex h-11 w-11 items-center justify-center rounded-full active:scale-90"
        >
          <Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : "text-muted"} />
        </button>
      </div>
    </article>
  );
});

function Highlighted({ item, q }: { item: Item; q: string }) {
  // Match against the value ignoring spaces/@/+ so "7777" finds "+998 00 777 77 77".
  const norm = (s: string) => s.toLowerCase().replace(/[\s@+]/g, "");
  const needle = norm(q);
  const v = item.value;
  const map: number[] = [];
  let flat = "";
  [...v].forEach((ch, i) => {
    if (!/[\s@+]/.test(ch)) {
      map.push(i);
      flat += ch.toLowerCase();
    }
  });
  const at = needle ? flat.indexOf(needle) : -1;
  if (at < 0) return <ItemValue item={item} variant="row" />;
  const s = map[at], e = map[at + needle.length - 1] + 1;
  const m = TYPE_META[item.type];
  return (
    <span className="font-mono font-bold tracking-tight whitespace-nowrap">
      {v.slice(0, s)}
      <mark className="rounded bg-transparent px-0.5" style={{ color: m.accent, background: m.soft }}>
        {v.slice(s, e)}
      </mark>
      {v.slice(e)}
    </span>
  );
}
