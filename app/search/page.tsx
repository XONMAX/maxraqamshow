"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { LayoutGrid, Search, SlidersHorizontal, X } from "lucide-react";
import { digitsOf, findCategory, handle, sortItems } from "@/lib/catalog";
import { TYPE_META } from "@/lib/meta";
import { useAllItems, useDict } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import type { ItemType, TypeFilter } from "@/lib/types";
import { PostRow } from "@/components/ItemCard";
import { CategoryChips } from "@/components/feed/CategoryChips";
import { useViewportFade } from "@/components/feed/useViewportFade";

const LENGTHS = ["any", "3", "4", "5", "6+"] as const;
type Len = (typeof LENGTHS)[number];

export default function SearchPage() {
  const d = useDict();
  const items = useAllItems();
  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [cat, setCat] = useState("all");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [len, setLen] = useState<Len>("any");
  const [showFilters, setShowFilters] = useState(false);
  const dq = useDeferredValue(q);
  const listRef = useRef<HTMLDivElement>(null);

  const activeFilters = (type !== "all" ? 1 : 0) + (cat !== "all" ? 1 : 0) + (minP || maxP ? 1 : 0) + (len !== "any" ? 1 : 0);

  const results = useMemo(() => {
    const needle = dq.toLowerCase().replace(/[\s@+]/g, "");
    const category = findCategory(type, cat);
    const lo = Number(minP) || 0, hi = Number(maxP) || Infinity;
    const list = items.filter((it) => {
      if (type !== "all" && it.type !== type) return false;
      if (!category.test(it)) return false;
      if (it.priceUSD < lo || it.priceUSD > hi) return false;
      if (len !== "any") {
        if (it.type === "phone") return false;
        const n = handle(it).length;
        if (len === "6+" ? n < 6 : n !== Number(len)) return false;
      }
      if (!needle) return true;
      return (it.type === "phone" ? digitsOf(it.value) : handle(it)).includes(needle);
    });
    return sortItems(list, "sequence", type);
  }, [items, dq, type, cat, minP, maxP, len]);

  useViewportFade(listRef, [results]);

  const chip = (active: boolean) => `h-9 rounded-md border text-[12px] font-medium ${active ? "border-fg bg-fg text-bg" : "border-line text-fg"}`;

  return (
    <>
      <header className="pt-safe z-20 shrink-0 border-b border-line bg-bg px-3 pb-2">
        <h1 className="flex h-12 items-center text-[17px] font-bold tracking-tight">{d.nav.search}</h1>
        <div className="flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-fg">
            <Search size={16} className="shrink-0 text-muted" aria-hidden />
            <input type="search" inputMode="search" autoComplete="off" autoCapitalize="none" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search.placeholder} aria-label={d.search.placeholder} className="min-w-0 flex-1 bg-transparent font-mono text-[15px] outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-muted" />
            {q && <button type="button" onClick={() => setQ("")} aria-label={d.search.reset} className="-mr-2 flex h-10 w-10 items-center justify-center text-muted"><X size={16} /></button>}
          </label>
          <button type="button" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} aria-label={d.search.filters} className={`relative flex h-11 w-11 items-center justify-center rounded-lg border ${showFilters ? "border-fg bg-fg text-bg" : "border-line"}`}>
            <SlidersHorizontal size={16} />
            {activeFilters > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-[3px] border border-bg bg-fg px-0.5 font-mono text-[10px] leading-[14px] text-bg">{activeFilters}</span>}
          </button>
        </div>

        <div className="overflow-hidden transition-[max-height,opacity] duration-200" style={{ maxHeight: showFilters ? 420 : 0, opacity: showFilters ? 1 : 0 }}>
          <div className="pt-3">
            <Label>{d.search.type}</Label>
            <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={d.search.type}>
              {(["all", "phone", "telegram", "instagram"] as TypeFilter[]).map((t) => {
                const Icon = t === "all" ? LayoutGrid : TYPE_META[t as ItemType].Icon;
                return (
                  <button key={t} type="button" role="radio" aria-checked={t === type} onClick={() => { setType(t); setCat("all"); }} className={`${chip(t === type)} flex items-center justify-center gap-1 px-1`}>
                    <Icon size={13} /><span className="truncate">{d.types[t]}</span>
                  </button>
                );
              })}
            </div>
            <Label>{d.search.category}</Label>
            <CategoryChips type={type} value={cat} onChange={setCat} className="-mx-3" />
            <Label>{d.search.price}</Label>
            <div className="flex items-center gap-2">
              <PriceInput value={minP} onChange={setMinP} placeholder={d.search.from} />
              <span className="text-muted">–</span>
              <PriceInput value={maxP} onChange={setMaxP} placeholder={d.search.to} />
            </div>
            <Label>{d.search.length}</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {LENGTHS.map((l) => (
                <button key={l} type="button" aria-pressed={len === l} onClick={() => setLen(l)} className={chip(len === l)}>
                  {l === "any" ? d.search.any : <span className="font-mono">{l}</span>}
                </button>
              ))}
            </div>
            {activeFilters > 0 && (
              <button type="button" onClick={() => { setType("all"); setCat("all"); setMinP(""); setMaxP(""); setLen("any"); }} className="mt-1 h-10 text-[12px] font-semibold underline underline-offset-2">
                {d.search.reset}
              </button>
            )}
          </div>
        </div>
      </header>

      <div ref={listRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <p className="px-3 py-2 font-mono text-[10px] tracking-wider text-muted uppercase" aria-live="polite">{fmt(d.search.results, { n: results.length })}</p>
        {results.length === 0 ? (
          <div className="mt-12 px-6 text-center">
            <p className="text-[14px] font-semibold">{d.search.empty}</p>
            <p className="mt-1 text-[12px] text-muted">{d.search.emptyHint}</p>
          </div>
        ) : (
          results.map((it) => (
            <div key={it.id} data-fade className="fade-blur">
              <PostRow item={it} />
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 mb-1.5 text-[10px] font-semibold tracking-wider text-muted uppercase first:mt-0">{children}</p>;
}

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-10 min-w-0 flex-1 items-center rounded-md border border-line px-2.5 focus-within:border-fg">
      <span className="text-muted">$</span>
      <input type="number" inputMode="numeric" min={0} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={`${placeholder}, USD`} className="w-full min-w-0 bg-transparent pl-1 font-mono text-[15px] outline-none placeholder:font-sans placeholder:text-[12px] placeholder:text-muted" />
    </label>
  );
}
