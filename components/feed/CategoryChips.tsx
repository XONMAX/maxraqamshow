"use client";

import { useEffect, useRef } from "react";
import { CATEGORIES } from "@/lib/catalog";
import { TYPE_META } from "@/lib/meta";
import { useDict } from "@/lib/store";
import type { ItemType, TypeFilter } from "@/lib/types";

interface Props {
  type: TypeFilter;
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function CategoryChips({ type, value, onChange, className = "" }: Props) {
  const d = useDict();
  const accent = type === "all" ? null : TYPE_META[type as ItemType];
  const rowRef = useRef<HTMLDivElement>(null);

  // Keep the selected chip in view when the type changes.
  useEffect(() => {
    rowRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [type, value]);

  return (
    <div
      ref={rowRef}
      className={`no-scrollbar -mx-4 flex snap-x snap-proximity gap-2 overflow-x-auto scroll-px-4 px-4 ${className}`}
    >
      {CATEGORIES[type].map((c) => {
        const active = c.key === value;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.key)}
            className="flex h-11 shrink-0 snap-start items-center"
          >
            <span
              className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                active ? "" : "border-line bg-surface text-fg/80"
              }`}
              style={
                active
                  ? accent
                    ? { background: accent.soft, borderColor: `${accent.accent}66`, color: accent.accent }
                    : { background: "var(--fg)", borderColor: "var(--fg)", color: "var(--bg)" }
                  : undefined
              }
            >
              {d.cats[c.key]}
              {c.hint && <span className="font-mono text-[11px] font-medium opacity-60">{c.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
