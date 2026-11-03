"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, Check } from "lucide-react";
import { queryFeed } from "@/lib/catalog";
import { useAllItems, useApp, useDict } from "@/lib/store";
import type { SortKey } from "@/lib/types";
import { Logo } from "../Logo";
import { ProBadge } from "../monetization/ProBadge";
import { CategoryChips } from "./CategoryChips";
import { EmptyFeed } from "./FeedExtras";
import { PostList } from "./PostList";
import { ProductRow } from "./ProductRow";
import { TypeTabs } from "./TypeTabs";

const SORTS: SortKey[] = ["sequence", "priceAsc", "priceDesc", "newest"];

/**
 * Home = sticky header (logo, tabs, chips) + scrolling body:
 *   [ single-line product row ]  ← promoted slots first
 *   [ compact post list ]        ← dense, virtualized
 * Switching tab/category swaps the body with a 160ms cross-fade (opacity only).
 */
export function HomeFeed() {
  const d = useDict();
  const items = useAllItems();
  const { type, category, sort, setCategory } = useApp();
  const cat = category[type] ?? "all";
  const feed = useMemo(() => queryFeed(items, type, cat, sort), [items, type, cat, sort]);
  const key = `${type}:${cat}:${sort}:${items.length}`;

  // Opacity-only cross-fade when the feed key changes (no layout animation).
  const [shown, setShown] = useState(key);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (key === shown) return;
    setVisible(false);
    const t = setTimeout(() => {
      setShown(key);
      setVisible(true);
    }, 160);
    return () => clearTimeout(t);
  }, [key, shown]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="pt-safe z-20 shrink-0 bg-bg">
        <div className="flex h-12 items-center justify-between px-3">
          <Logo />
          <div className="flex items-center gap-1">
            <ProBadge />
            <SortMenu />
          </div>
        </div>
        <TypeTabs />
      </header>

      <div className="flex min-h-0 flex-1 flex-col transition-opacity duration-150" style={{ opacity: visible ? 1 : 0 }}>
        {feed.length === 0 ? (
          <>
            <CategoryChips type={type} value={cat} onChange={(k) => setCategory(type, k)} className="border-b border-line" />
            <EmptyFeed />
          </>
        ) : (
          <PostList
            key={shown}
            items={feed}
            header={
              <>
                <CategoryChips type={type} value={cat} onChange={(k) => setCategory(type, k)} className="border-b border-line" />
                <ProductRow items={feed} />
                <div className="flex items-baseline justify-between px-3 pt-3 pb-1">
                  <h2 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{d.mono.posts}</h2>
                  <span className="font-mono text-[10px] text-muted tabular">{feed.length}</span>
                </div>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}

function SortMenu() {
  const d = useDict();
  const sort = useApp((s) => s.sort);
  const setSort = useApp((s) => s.setSort);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-11 items-center gap-1.5 px-2 text-[12px] font-semibold">
        <ArrowDownUp size={14} />
        <span className="max-w-[6rem] truncate">{d.sort[sort]}</span>
      </button>
      <div
        role="menu"
        className="absolute top-11 right-0 z-30 w-44 rounded-lg border border-line-strong bg-bg p-1 transition-opacity duration-150"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      >
        {SORTS.map((s) => (
          <button key={s} role="menuitemradio" aria-checked={s === sort} type="button" onClick={() => { setSort(s); setOpen(false); }} className="flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-[13px] active:bg-surface-2">
            {d.sort[s]}
            {s === sort && <Check size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}
