"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { CircleAlert, Lock, Unlock } from "lucide-react";
import { DealTimeline } from "@/components/deal/DealTimeline";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { ItemHeader } from "@/components/sheet/ItemDetails";
import { Button } from "@/components/ui";
import { useApp, useDict, useUI } from "@/lib/store";
import { formatUZS } from "@/lib/format";

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
    const t = setTimeout(() => setStatus(deal.id, step.next), step.ms);
    return () => clearTimeout(t);
  }, [deal, setStatus]);

  if (!deal)
    return (
      <>
        <PageHeader title={d.deal.title} back />
        <PageBody>{hydrated && <p className="mt-10 text-center text-[13px] text-muted">{d.deal.notFound}</p>}</PageBody>
      </>
    );

  const confirmed = deal.status === "confirmed";
  return (
    <>
      <PageHeader title={<span>{d.deal.title} <span className="font-mono text-[12px] font-medium text-muted">#{deal.id}</span></span>} back />
      <PageBody>
        <div className="mt-3 rounded-lg border border-line p-3">
          <ItemHeader item={deal.item} />
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-line p-3">
          {confirmed ? <Unlock size={18} /> : <Lock size={18} />}
          <div>
            <p className="text-[11px] text-muted">{confirmed ? d.deal.released : d.deal.held}</p>
            <p className="font-mono text-[16px] font-semibold tabular">{formatUZS(deal.totalUZS, lang)}</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-line p-3">
          <DealTimeline deal={deal} />
        </div>
        {deal.status === "delivered" && (
          <Button className="mt-3 w-full" onClick={() => { setStatus(deal.id, "confirmed"); toast(d.deal.status.confirmed); }}>
            {d.deal.confirm}
          </Button>
        )}
        {!confirmed && (
          <button type="button" className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 text-[12px] text-muted">
            <CircleAlert size={13} /> {d.deal.dispute}
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-muted">{d.deal.demoNote}</p>
        {confirmed && (
          <Link href="/" className="mt-3 block">
            <Button variant="outline" className="w-full">{d.saved.goFeed}</Button>
          </Link>
        )}
      </PageBody>
    </>
  );
}
