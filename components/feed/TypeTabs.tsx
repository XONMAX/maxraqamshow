"use client";

import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { BRAND_GRADIENT, TYPE_META } from "@/lib/meta";
import { useApp, useDict } from "@/lib/store";
import type { ItemType, TypeFilter } from "@/lib/types";

const TABS: TypeFilter[] = ["all", "phone", "telegram", "instagram"];

export function TypeTabs() {
  const d = useDict();
  const type = useApp((s) => s.type);
  const setType = useApp((s) => s.setType);

  return (
    <div role="tablist" aria-label="Type" className="flex gap-1 rounded-2xl border border-line bg-surface p-1">
      {TABS.map((t) => {
        const active = t === type;
        const m = t === "all" ? null : TYPE_META[t as ItemType];
        const Icon = m?.Icon ?? LayoutGrid;
        return (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={active}
            aria-label={d.types[t]}
            onClick={() => {
              if (!active) navigator.vibrate?.(6);
              setType(t);
            }}
            className={`relative flex h-11 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors ${
              t === "all" ? "w-12 shrink-0" : "min-w-0 flex-1"
            } ${active ? "text-white" : "text-muted"}`}
          >
            {active && (
              <motion.span
                layoutId="type-pill"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: m ? m.bg : BRAND_GRADIENT,
                  boxShadow: `0 8px 20px -10px ${m ? m.glow : "rgba(34,158,217,.5)"}`,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative" style={{ color: active ? "#fff" : m?.accent }}>
              <Icon size={17} strokeWidth={2.4} />
            </span>
            {t !== "all" && <span className="relative truncate">{d.types[t]}</span>}
          </button>
        );
      })}
    </div>
  );
}
