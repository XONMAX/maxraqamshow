"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Check, GalleryVertical, Rows3 } from "lucide-react";
import { queryFeed } from "@/lib/catalog";
import { useAllItems, useApp, useDict } from "@/lib/store";
import type { SortKey } from "@/lib/types";
import { Logo } from "../Logo";
import { IconButton } from "../ui";
import { CategoryChips } from "./CategoryChips";
import { EmptyFeed } from "./FeedExtras";
import { ListFeed } from "./ListFeed";
import { ReelsFeed } from "./ReelsFeed";
import { TypeTabs } from "./TypeTabs";

const SORTS: SortKey[] = ["sequence", "priceAsc", "priceDesc", "newest"];

export function HomeFeed() {
  const d = useDict();
  const items = useAllItems();
  const { type, category, sort, viewMode, setCategory, setViewMode } = useApp();
  const cat = category[type] ?? "all";

  const feed = useMemo(() => queryFeed(items, type, cat, sort), [items, type, cat, sort]);
  const feedKey = `${type}:${cat}:${sort}:${viewMode}:${items.length}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="pt-safe z-20 shrink-0 bg-bg/85 px-4 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between">
          <Logo />
          <div className="-mr-2 flex items-center">
            <SortMenu />
            <IconButton
              label={viewMode === "reels" ? d.view.list : d.view.reels}
              onClick={() => setViewMode(viewMode === "reels" ? "list" : "reels")}
            >
              {viewMode === "reels" ? <Rows3 size={20} /> : <GalleryVertical size={20} />}
            </IconButton>
          </div>
        </div>
        <TypeTabs />
        <CategoryChips type={type} value={cat} onChange={(k) => setCategory(type, k)} className="mt-1 pb-1" />
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={feedKey}
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          {feed.length === 0 ? (
            <EmptyFeed />
          ) : viewMode === "reels" ? (
            <ReelsFeed items={feed} />
          ) : (
            <ListFeed items={feed} />
          )}
        </motion.div>
      </AnimatePresence>
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
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-1.5 rounded-2xl px-2.5 text-[13px] font-semibold"
      >
        <ArrowDownUp size={17} />
        <span className="max-w-[7.5rem] truncate">{d.sort[sort]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute top-12 right-0 z-30 w-52 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-2xl"
          >
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{d.sort.title}</p>
            {SORTS.map((s) => (
              <button
                key={s}
                role="menuitemradio"
                aria-checked={s === sort}
                type="button"
                onClick={() => {
                  setSort(s);
                  setOpen(false);
                }}
                className="flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] active:bg-surface-2"
              >
                {d.sort[s]}
                {s === sort && <Check size={16} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
