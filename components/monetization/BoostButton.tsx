"use client";

import { ArrowUpToLine } from "lucide-react";
import { PRICING, useBilling } from "@/lib/billing";
import { useDict, useUI } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { Button, Pill } from "../ui";

/** One-tap boost for the owner's listing. Pays coins; opens the paywall when the balance is short. */
export function BoostButton({ itemId, size = "sm" }: { itemId: string; size?: "sm" | "md" }) {
  const d = useDict();
  const boosted = useBilling((s) => s.isBoosted(itemId));
  const boost = useBilling((s) => s.boost);
  const openPaywall = useBilling((s) => s.openPaywall);
  const toast = useUI((s) => s.showToast);

  if (boosted) return <Pill solid>{d.mono.boosted}</Pill>;

  const onClick = () => {
    if (boost(itemId)) toast(fmt(d.mono.boosted_ok, { h: PRICING.boostHours }));
    else openPaywall({ reason: "boost", itemId });
  };

  if (size === "sm")
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-fg px-2 text-[11px] font-semibold text-fg">
        <ArrowUpToLine size={11} /> {d.mono.boost}
      </button>
    );
  return (
    <Button variant="outline" onClick={onClick} className="w-full">
      <ArrowUpToLine size={15} /> {fmt(d.mono.boostFor, { n: PRICING.boostCost, h: PRICING.boostHours })}
    </Button>
  );
}
