"use client";

import { motion } from "framer-motion";
import { Check, CreditCard, PackageCheck, Repeat2, ShieldCheck } from "lucide-react";
import { useApp, useDict } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { DEAL_STEPS, type Deal, type DealStatus } from "@/lib/types";

export const STATUS_STYLE: Record<DealStatus, { color: string; Icon: typeof Check }> = {
  paid: { color: "#8B5CF6", Icon: CreditCard }, // violet — money locked
  transferring: { color: "#F59E0B", Icon: Repeat2 }, // amber — in progress
  delivered: { color: "#229ED9", Icon: PackageCheck }, // blue — handed over
  confirmed: { color: "#10B981", Icon: ShieldCheck }, // green — complete
};

/** Vertical Paid → Seller transferring → Delivered → Confirmed timeline. */
export function DealTimeline({ deal }: { deal: Deal }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const current = DEAL_STEPS.indexOf(deal.status);

  return (
    <ol className="relative">
      {DEAL_STEPS.map((step, i) => {
        const { color, Icon } = STATUS_STYLE[step];
        const done = i < current || deal.status === "confirmed";
        const isCurrent = i === current && deal.status !== "confirmed";
        const reached = i <= current;
        const at = deal.history[step];
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {i < DEAL_STEPS.length - 1 && (
              <span className="absolute top-11 bottom-1 left-[21px] w-0.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <motion.span
                  className="absolute inset-x-0 top-0 block"
                  style={{ background: color }}
                  initial={false}
                  animate={{ height: i < current ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </span>
            )}
            <span className="relative shrink-0">
              {isCurrent && (
                <motion.span
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: color }}
                  animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  aria-hidden
                />
              )}
              <span
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors duration-300"
                style={
                  reached
                    ? { background: color, borderColor: color, color: "#fff" }
                    : { background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--muted)" }
                }
              >
                {done ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
              </span>
            </span>
            <div className="min-w-0 pt-1">
              <p className={`text-[15px] font-semibold ${reached ? "" : "text-muted"}`}>
                {d.deal.status[step]}
                {isCurrent && (
                  <span className="ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-bold" style={{ color, background: `${color}22` }}>
                    ●
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">
                {reached ? d.deal.statusHint[step] : d.deal.waiting}
              </p>
              {at && <p className="mt-1 font-mono text-[11px] text-muted tabular">{formatDate(at, lang, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Four-dot mini progress used in lists. */
export function DealDots({ status }: { status: DealStatus }) {
  const cur = DEAL_STEPS.indexOf(status);
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {DEAL_STEPS.map((s, i) => (
        <span
          key={s}
          className="h-1.5 w-5 rounded-full"
          style={{ background: i <= cur ? STATUS_STYLE[DEAL_STEPS[cur]].color : "var(--line)" }}
        />
      ))}
    </span>
  );
}
