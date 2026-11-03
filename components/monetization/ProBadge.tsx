"use client";

import { Coins } from "lucide-react";
import { useBilling } from "@/lib/billing";
import { useDict } from "@/lib/store";
import { Pill } from "../ui";

/** Header entry point: shows [PRO] when subscribed, else the coin balance; tap opens the paywall. */
export function ProBadge() {
  const d = useDict();
  const isPro = useBilling((s) => s.isPro());
  const coins = useBilling((s) => s.coins);
  const openPaywall = useBilling((s) => s.openPaywall);
  return (
    <button type="button" onClick={() => openPaywall({ reason: isPro ? "coins" : "upgrade" })} className="flex h-11 items-center gap-1.5 px-2" aria-label={d.mono.paywallTitle}>
      {isPro ? <Pill solid>{d.mono.pro}</Pill> : <Pill>{d.mono.pro}</Pill>}
      <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-muted tabular">
        <Coins size={11} /> {coins}
      </span>
    </button>
  );
}
