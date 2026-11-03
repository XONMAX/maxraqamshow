"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { CircleAlert, Lock, Unlock } from "lucide-react";
import { DealTimeline, STATUS_STYLE } from "@/components/deal/DealTimeline";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { ItemHeader } from "@/components/sheet/ItemDetails";
import { TYPE_META } from "@/lib/meta";
import { useApp, useDict, useUI } from "@/lib/store";
import { formatUZS } from "@/lib/format";

/** Demo seller simulation: paid → transferring → delivered; the buyer confirms the last step. */
const AUTO_ADVANCE = { paid: { next: "transferring", ms: 2500 }, transferring: { next: "delivered", ms: 4500 } } as const;

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const deal = useApp((s) => s.deals.find((x) => x.id === id));
  const setStatus = useApp((s) => s.setDealStatus);
  const hydrated = useUI((s) => s.hydrated);
  const toast = useUI((s) => s.showToast);

  useEffect(() => {
    if (!deal) return;
    const step = AUTO_ADVANCE[deal.status as keyof typeof AUTO_ADVANCE];
    if (!step) return;
    const t = setTimeout(() => {
      setStatus(deal.id, step.next);
      navigator.vibrate?.(10);
    }, step.ms);
    return () => clearTimeout(t);
  }, [deal, setStatus]);

  if (!deal) {
    return (
      <>
        <PageHeader title={d.deal.title} back />
        <PageBody>{hydrated && <p className="mt-10 text-center text-muted">{d.deal.notFound}</p>}</PageBody>
      </>
    );
  }

  const confirmed = deal.status === "confirmed";
  const m = TYPE_META[deal.item.type];
  const st = STATUS_STYLE[deal.status];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-baseline gap-2">
            {d.deal.title} <span className="font-mono text-[13px] font-semibold text-muted">#{deal.id}</span>
          </span>
        }
        back
      />
      <PageBody>
        <div className="mt-4 rounded-2xl border bg-surface p-3" style={{ borderColor: `${m.accent}40` }}>
          <ItemHeader item={deal.item} />
        </div>

        <div
          className="mt-3 flex items-center gap-3 rounded-2xl p-4"
          style={{ background: `${confirmed ? STATUS_STYLE.confirmed.color : st.color}1a` }}
        >
          {confirmed ? <Unlock size={22} style={{ color: STATUS_STYLE.confirmed.color }} /> : <Lock size={22} style={{ color: st.color }} />}
          <div>
            <p className="text-[12px] font-semibold text-muted">{confirmed ? d.deal.released : d.deal.held}</p>
            <p className="font-mono text-[18px] font-bold tabular">{formatUZS(deal.totalUZS, lang)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
          <DealTimeline deal={deal} />
        </div>

        {deal.status === "delivered" && (
          <button
            type="button"
            onClick={() => {
              setStatus(deal.id, "confirmed");
              navigator.vibrate?.([10, 50, 20]);
              toast(d.deal.status.confirmed);
            }}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl font-semibold text-white active:scale-[0.98]"
            style={{ background: STATUS_STYLE.confirmed.color }}
          >
            {d.deal.confirm}
          </button>
        )}
        {!confirmed && (
          <button type="button" className="mt-3 flex h-11 w-full items-center justify-center gap-2 text-[13px] text-muted">
            <CircleAlert size={16} /> {d.deal.dispute}
          </button>
        )}
        <p className="mt-4 text-center text-[12px] text-amber-600 dark:text-amber-400">{d.deal.demoNote}</p>
        {confirmed && (
          <Link href="/" className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-line font-semibold">
            {d.saved.goFeed}
          </Link>
        )}
      </PageBody>
    </>
  );
}
