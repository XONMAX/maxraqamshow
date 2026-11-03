"use client";

import { LayoutGrid } from "lucide-react";
import { TYPE_META } from "@/lib/meta";
import { useApp, useDict } from "@/lib/store";
import type { ItemType, TypeFilter } from "@/lib/types";

const TABS: TypeFilter[] = ["all", "phone", "telegram", "instagram"];

/** Monochrome segmented tabs: active = solid fill, inactive = text only. 40px tall. */
export function TypeTabs() {
  const d = useDict();
  const type = useApp((s) => s.type);
  const setType = useApp((s) => s.setType);
  return (
    <div role="tablist" aria-label="Type" className="flex h-10 border-b border-line">
      {TABS.map((t) => {
        const active = t === type;
        const Icon = t === "all" ? LayoutGrid : TYPE_META[t as ItemType].Icon;
        return (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={active}
            aria-label={d.types[t]}
            onClick={() => setType(t)}
            className={`relative flex min-w-0 flex-1 items-center justify-center gap-1.5 text-[12px] font-semibold transition-colors ${active ? "text-fg" : "text-muted"}`}
          >
            <Icon size={14} strokeWidth={2} />
            {t !== "all" && <span className="truncate">{d.types[t]}</span>}
            {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-fg" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
