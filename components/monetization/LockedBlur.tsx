"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useBilling, PRICING } from "@/lib/billing";
import { useDict } from "@/lib/store";
import { fmt } from "@/lib/i18n";

/**
 * Freemium gate. Children are rendered (so layout is stable) but blurred;
 * a minimal "Unlock" trigger fades in on top. Native: `.blur(radius: 8)` + overlay.
 */
export function LockedBlur({ itemId, locked, children, compact, className = "" }: { itemId: string; locked: boolean; children: ReactNode; compact?: boolean; className?: string }) {
  const d = useDict();
  const openPaywall = useBilling((s) => s.openPaywall);
  if (!locked) return <>{children}</>;
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none blur-[7px] select-none" aria-hidden>
        {children}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openPaywall({ reason: "unlock", itemId });
        }}
        className="absolute inset-0 flex items-center justify-center bg-bg/30 transition-opacity duration-200 hover:opacity-90"
        aria-label={d.mono.unlock}
      >
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-fg bg-bg font-semibold text-fg ${compact ? "h-7 px-2 text-[11px]" : "h-9 px-3 text-[13px]"}`}>
          <Lock size={compact ? 11 : 13} />
          {compact ? d.mono.unlock : fmt(d.mono.unlockFor, { n: PRICING.unlockCost })}
        </span>
      </button>
    </div>
  );
}
