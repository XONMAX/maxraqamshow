"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, digitsOf, findCategory, handle, sortItems } from "@/lib/catalog";
import { TYPE_META } from "@/lib/meta";
import { useAllItems, useDict } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import type { ItemType, TypeFilter } from "@/lib/types";
import { CompactCard } from "@/components/ItemCard";
import { CategoryChips } from "@/components/feed/CategoryChips";
import { PageBody } from "@/components/PageHeader";

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

  const activeFilters = (type !== "all" ? 1 : 0) + (cat !== "all" ? 1 : 0) + (minP || maxP ? 1 : 0) + (len !== "any" ? 1 : 0);

  const results = useMemo(() => {
    const needle = dq.toLowerCase().replace(/[\s@+]/g, "");
    const category = findCategory(type, cat);
    const lo = Number(minP) || 0;
    const hi = Number(maxP) || Infinity;
    const list = items.filter((it) => {
      if (type !== "all" && it.type !== type) return false;
      if (!category.test(it)) return false;
      if (it.priceUSD < lo || it.priceUSD > hi) return false;
      if (len !== "any") {
        if (it.type === "phone") return false; // length applies to usernames
        const n = handle(it).length;
        if (len === "6+" ? n < 6 : n !== Number(len)) return false;
      }
      if (!needle) return true;
      const hay = it.type === "phone" ? digitsOf(it.value) : handle(it);
      return hay.includes(needle);
    });
    return sortItems(list, "sequence", type);
  }, [items, dq, type, cat, minP, maxP, len]);

  const reset = () => {
    setType("all");
    setCat("all");
    setMinP("");
    setMaxP("");
    setLen("any");
  };

  return (
    <>
      <header className="pt-safe z-20 shrink-0 border-b border-line bg-bg/85 px-4 pb-3 backdrop-blur-xl">
        <h1 className="flex h-14 items-center text-[20px] font-extrabold tracking-tight">{d.nav.search}</h1>
        <div className="flex gap-2">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 focus-within:border-[#229ED9]">
            <Search size={18} className="shrink-0 text-muted" aria-hidden />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={d.search.placeholder}
              aria-label={d.search.placeholder}
              className="min-w-0 flex-1 bg-transparent font-mono text-[16px] outline-none placeholder:font-sans placeholder:text-muted"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label={d.search.reset} className="-mr-2 flex h-10 w-10 items-center justify-center text-muted">
                <X size={18} />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-label={d.search.filters}
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border ${
              showFilters ? "border-fg bg-fg text-bg" : "border-line bg-surface"
            }`}
          >
            <SlidersHorizontal size={19} />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-[#229ED9] px-1 text-[11px] leading-5 font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <FilterLabel>{d.search.type}</FilterLabel>
                <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={d.search.type}>
                  {(["all", "phone", "telegram", "instagram"] as TypeFilter[]).map((t) => {
                    const m = t === "all" ? null : TYPE_META[t as ItemType];
                    const Icon = m?.Icon ?? LayoutGrid;
                    const active = t === type;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setType(t);
                          setCat("all");
                        }}
                        className="flex h-11 items-center justify-center gap-1.5 rounded-xl border text-[12px] font-semibold"
                        style={
                          active
                            ? m
                              ? { background: m.soft, borderColor: m.accent, color: m.accent }
                              : { background: "var(--fg)", borderColor: "var(--fg)", color: "var(--bg)" }
                            : { borderColor: "var(--line)" }
                        }
                      >
                        <span style={{ color: active ? undefined : m?.accent }}>
                          <Icon size={15} />
                        </span>
                        <span className="truncate">{d.types[t]}</span>
                      </button>
                    );
                  })}
                </div>

                <FilterLabel>{d.search.category}</FilterLabel>
                <CategoryChips type={type} value={cat} onChange={setCat} />

                <FilterLabel>{d.search.price}</FilterLabel>
                <div className="flex items-center gap-2">
                  <PriceInput value={minP} onChange={setMinP} placeholder={d.search.from} />
                  <span className="text-muted">–</span>
                  <PriceInput value={maxP} onChange={setMaxP} placeholder={d.search.to} />
                </div>
                <FilterLabel>{d.search.length}</FilterLabel>
                <div className="grid grid-cols-5 gap-1.5">
                  {LENGTHS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={len === l}
                      onClick={() => setLen(l)}
                      className={`h-11 rounded-xl border text-[13px] font-semibold ${
                        len === l ? "border-fg bg-fg text-bg" : "border-line"
                      }`}
                    >
                      {l === "any" ? d.search.any : <span className="font-mono">{l}</span>}
                    </button>
                  ))}
                </div>
                {activeFilters > 0 && (
                  <button type="button" onClick={reset} className="mt-2 h-11 text-[13px] font-semibold text-[#229ED9]">
                    {d.search.reset}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <PageBody>
        <p className="py-3 text-[12px] font-semibold text-muted" aria-live="polite">
          {fmt(d.search.results, { n: results.length })}
        </p>
        {results.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="font-semibold">{d.search.empty}</p>
            <p className="mt-1 text-[13px] text-muted">{d.search.emptyHint}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {results.map((it, i) => (
              <motion.li
                key={it.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
              >
                <CompactCard item={it} highlight={dq} />
              </motion.li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase first:mt-0">{children}</p>;
}

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-line bg-surface px-2.5">
      <span className="text-muted">$</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={`${placeholder}, USD`}
        className="w-full min-w-0 bg-transparent pl-1 font-mono text-[16px] outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-muted"
      />
    </label>
  );
}
