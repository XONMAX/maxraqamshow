"use client";

import { Check, CreditCard, PackageCheck, Repeat2, ShieldCheck } from "lucide-react";
import { useApp, useDict } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { DEAL_STEPS, type Deal, type DealStatus } from "@/lib/types";

/** Status is encoded by fill, not colour: done = solid, current = outlined + pulse, pending = dashed. */
export const STATUS_ICON: Record<DealStatus, typeof Check> = {
  paid: CreditCard,
  transferring: Repeat2,
  delivered: PackageCheck,
  confirmed: ShieldCheck,
};

export function DealTimeline({ deal }: { deal: Deal }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const current = DEAL_STEPS.indexOf(deal.status);
  return (
    <ol>
      {DEAL_STEPS.map((step, i) => {
        const Icon = STATUS_ICON[step];
        const done = i < current || deal.status === "confirmed";
        const isCurrent = i === current && deal.status !== "confirmed";
        const at = deal.history[step];
        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {i < DEAL_STEPS.length - 1 && (
              <span className={`absolute top-9 bottom-0 left-[15px] w-px ${i < current ? "bg-fg" : "border-l border-dashed border-line-strong"}`} aria-hidden />
            )}
            <span
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                done ? "border-fg bg-fg text-bg" : isCurrent ? "border-fg text-fg" : "border-dashed border-line-strong text-muted"
              }`}
            >
              {isCurrent && <span className="absolute inset-0 animate-pulse rounded-md border border-fg" aria-hidden />}
              {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
            </span>
            <div className="min-w-0 pt-1">
              <p className={`text-[14px] font-semibold ${done || isCurrent ? "" : "text-muted"}`}>{d.deal.status[step]}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">{done || isCurrent ? d.deal.statusHint[step] : d.deal.waiting}</p>
              {at && <p className="mt-0.5 font-mono text-[10px] text-muted tabular">{formatDate(at, lang, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DealDots({ status }: { status: DealStatus }) {
  const cur = DEAL_STEPS.indexOf(status);
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {DEAL_STEPS.map((s, i) => (
        <span key={s} className={`h-1 w-4 rounded-sm ${i <= cur ? "bg-fg" : "bg-line"}`} />
      ))}
    </span>
  );
}
