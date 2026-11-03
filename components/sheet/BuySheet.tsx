"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock } from "lucide-react";
import { TYPE_META } from "@/lib/meta";
import { useApp, useDict, useItem, useUI } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { ESCROW_FEE } from "@/lib/types";
import { TelegramLogin } from "../auth/TelegramLogin";
import { Spinner } from "../ui";
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
  const [method, setMethod] = useState<"local" | "intl">("local");
  const [paying, setPaying] = useState(false);
  const close = useCallback(() => !paying && openBuy(null), [openBuy, paying]);

  if (!item) return <BottomSheet open={false} onClose={close}>{null}</BottomSheet>;

  const m = TYPE_META[item.type];
  const fee = Math.round(item.priceUZS * ESCROW_FEE);
  const total = item.priceUZS + fee;

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const deal = createDeal(item);
      navigator.vibrate?.([12, 40, 12]);
      setPaying(false);
      openBuy(null);
      openSheet(null);
      router.push(`/deals/${deal.id}`);
    }, 1200);
  };

  const row = (label: string, value: string, strong?: boolean) => (
    <div className={`flex items-baseline justify-between ${strong ? "pt-2 text-[16px] font-bold" : "text-[14px]"}`}>
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
          <button
            type="button"
            disabled={paying}
            onClick={pay}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-white disabled:opacity-80"
            style={{ background: m.bg }}
          >
            {paying ? <Spinner /> : <Lock size={17} aria-hidden />}
            {paying ? d.buy.paying : fmt(d.buy.pay, { sum: formatUZS(total, lang) })}
          </button>
        ) : undefined
      }
    >
      <div className="rounded-2xl border border-line p-3">
        <ItemHeader item={item} />
      </div>

      <div className="mt-4 space-y-1.5 rounded-2xl bg-surface-2 p-4">
        {row(d.buy.price, formatUZS(item.priceUZS, lang))}
        {row(d.buy.fee, formatUZS(fee, lang))}
        <div className="border-t border-line" />
        {row(d.buy.total, formatUZS(total, lang), true)}
      </div>

      {user ? (
        <>
          <p className="mt-5 mb-2 text-[13px] font-semibold tracking-wide text-muted uppercase">{d.buy.method}</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={d.buy.method}>
            {(["local", "intl"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={method === k}
                onClick={() => setMethod(k)}
                className="flex h-14 items-center gap-2 rounded-2xl border px-3 text-left text-[13px] font-semibold"
                style={method === k ? { borderColor: m.accent, background: m.soft } : { borderColor: "var(--line)" }}
              >
                <CreditCard size={18} aria-hidden style={{ color: method === k ? m.accent : undefined }} />
                {k === "local" ? d.buy.cardLocal : d.buy.cardIntl}
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
            <Lock size={14} aria-hidden /> {d.buy.secure}
          </p>
          <p className="mt-1 text-[12px] text-amber-600 dark:text-amber-400">{d.buy.demoNote}</p>
        </>
      ) : (
        <div className="mt-5">
          <p className="mb-3 text-center text-[14px] font-semibold">{d.buy.loginFirst}</p>
          <TelegramLogin />
        </div>
      )}
    </BottomSheet>
  );
}
