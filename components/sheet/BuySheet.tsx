"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock } from "lucide-react";
import { useBilling } from "@/lib/billing";
import { useApp, useDict, useItem, useUI } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { TelegramLogin } from "../auth/TelegramLogin";
import { Button, Spinner } from "../ui";
import { BottomSheet } from "./BottomSheet";
import { ItemHeader } from "./ItemDetails";

export function BuySheet() {
  const d = useDict();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const user = useApp((s) => s.user);
  const createDeal = useApp((s) => s.createDeal);
  const id = useUI((s) => s.buyId);
  const openBuy = useUI((s) => s.openBuy);
  const openSheet = useUI((s) => s.openSheet);
  const item = useItem(id);
  const isPro = useBilling((s) => s.isPro());
  const commissionFor = useBilling((s) => s.commissionFor);
  const openPaywall = useBilling((s) => s.openPaywall);
  const [method, setMethod] = useState<"local" | "intl">("local");
  const [paying, setPaying] = useState(false);
  const close = useCallback(() => !paying && openBuy(null), [openBuy, paying]);

  if (!item) return <BottomSheet open={false} onClose={close}>{null}</BottomSheet>;

  const fee = commissionFor(item.priceUZS);
  const total = item.priceUZS + fee;

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const deal = createDeal(item, fee);
      setPaying(false);
      openBuy(null);
      openSheet(null);
      router.push(`/deals/${deal.id}`);
    }, 1000);
  };

  const row = (label: string, value: string, strong?: boolean) => (
    <div className={`flex items-baseline justify-between ${strong ? "pt-2 text-[15px] font-semibold" : "text-[13px]"}`}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="font-mono tabular">{value}</span>
    </div>
  );

  return (
    <BottomSheet
      open
      onClose={close}
      z={60}
      title={<p className="text-[17px] font-bold">{d.buy.title}</p>}
      footer={
        user ? (
          <Button onClick={pay} disabled={paying} className="w-full">
            {paying ? <Spinner /> : <Lock size={15} />} {paying ? d.buy.paying : fmt(d.buy.pay, { sum: formatUZS(total, lang) })}
          </Button>
        ) : undefined
      }
    >
      <div className="rounded-lg border border-line p-3">
        <ItemHeader item={item} />
      </div>

      <div className="mt-3 space-y-1 rounded-lg border border-line p-3">
        {row(d.buy.price, formatUZS(item.priceUZS, lang))}
        {row(`${d.buy.fee} · ${isPro ? d.mono.feePro : d.mono.feeFree}`, formatUZS(fee, lang))}
        <div className="border-t border-line" />
        {row(d.buy.total, formatUZS(total, lang), true)}
      </div>
      {!isPro && (
        <button type="button" onClick={() => openPaywall({ reason: "upgrade", itemId: item.id })} className="mt-2 h-10 w-full text-left text-[12px] text-muted underline underline-offset-2">
          {fmt(d.mono.youSave, { sum: formatUZS(fee - Math.round(item.priceUZS * 0.02), lang) })}
        </button>
      )}

      {user ? (
        <>
          <p className="mt-4 mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{d.buy.method}</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={d.buy.method}>
            {(["local", "intl"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)} className={`flex h-12 items-center gap-2 rounded-lg border px-3 text-left text-[13px] font-semibold ${method === k ? "border-fg" : "border-line"}`}>
                <CreditCard size={16} aria-hidden />
                {k === "local" ? d.buy.cardLocal : d.buy.cardIntl}
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[12px] text-muted">
            <Lock size={12} aria-hidden /> {d.buy.secure}
          </p>
          <p className="mt-1 text-[11px] text-muted">{d.buy.demoNote}</p>
        </>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-center text-[13px] font-semibold">{d.buy.loginFirst}</p>
          <TelegramLogin />
        </div>
      )}
    </BottomSheet>
  );
}
