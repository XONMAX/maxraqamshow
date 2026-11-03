"use client";

import { useEffect, useRef } from "react";
import { CATEGORIES } from "@/lib/catalog";
import { useDict } from "@/lib/store";
import type { TypeFilter } from "@/lib/types";

/** Swipeable chips, 28px tall. Active = solid; inactive = 1px border. */
export function CategoryChips({ type, value, onChange, className = "" }: { type: TypeFilter; value: string; onChange: (key: string) => void; className?: string }) {
  const d = useDict();
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rowRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [type, value]);

  return (
    <div ref={rowRef} className={`no-scrollbar flex gap-1.5 overflow-x-auto px-3 ${className}`}>
      {CATEGORIES[type].map((c) => {
        const active = c.key === value;
        return (
          <button key={c.key} type="button" aria-pressed={active} onClick={() => onChange(c.key)} className="flex h-10 shrink-0 items-center">
            <span className={`flex h-7 items-center gap-1 rounded-md border px-2.5 text-[12px] font-medium whitespace-nowrap ${active ? "border-fg bg-fg text-bg" : "border-line text-fg"}`}>
              {d.cats[c.key]}
              {c.hint && <span className={`font-mono text-[10px] ${active ? "opacity-70" : "text-muted"}`}>{c.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
