"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Coins } from "lucide-react";
import { PRICING, useBilling, type ProductId } from "@/lib/billing";
import { useApp, useDict, useItem, useUI } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { BottomSheet } from "../sheet/BottomSheet";
import { Button, Spinner } from "../ui";

/**
 * Monochrome subscription sheet: Monthly / Yearly / Lifetime / Coin top-up.
 * Opened via useBilling().openPaywall({ reason }). No colour, no imagery: type + 1px borders.
 */
export function Paywall() {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const toast = useUI((s) => s.showToast);
  const { paywall, products, busy, coins, load, closePaywall, purchase, unlock, restore } = useBilling();
  const isPro = useBilling((s) => s.isPro());
  const item = useItem(paywall?.itemId);
  const [sel, setSel] = useState<ProductId>("yearly");

  useEffect(() => {
    if (products.length === 0) load();
  }, [products.length, load]);
  useEffect(() => {
    if (paywall?.reason === "boost" || paywall?.reason === "coins") setSel("coins_100");
    else setSel("yearly");
  }, [paywall]);

  const close = useCallback(() => closePaywall(), [closePaywall]);

  const onContinue = async () => {
    const res = await purchase(sel);
    if (!res.ok) return toast(d.misc.loginFail);
    // After a coin top-up that was triggered by an unlock, finish the unlock in place.
    if (paywall?.reason === "unlock" && paywall.itemId && !useBilling.getState().isPro()) unlock(paywall.itemId);
    close();
  };

  const onUnlockWithCoins = () => {
    if (paywall?.itemId && unlock(paywall.itemId)) close();
    else toast(d.mono.notEnough);
  };

  const plan = (id: ProductId, label: string, suffix: string) => {
    const p = products.find((x) => x.id === id);
    const active = sel === id;
    return (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => setSel(id)}
        className={`flex h-14 w-full items-center justify-between rounded-lg border px-4 ${active ? "border-fg" : "border-line"}`}
      >
        <span className="flex items-center gap-3">
          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? "border-fg bg-fg text-bg" : "border-line-strong"}`}>
            {active && <Check size={10} strokeWidth={3} />}
          </span>
          <span className="text-[14px] font-semibold">{label}</span>
          {p?.badge && <span className="rounded-[4px] border border-fg px-1 font-mono text-[10px]">{p.badge}</span>}
        </span>
        <span className="font-mono text-[14px] tabular">
          {p?.price ?? "…"} <span className="text-[11px] text-muted">{suffix}</span>
        </span>
      </button>
    );
  };

  const samplePrice = item?.priceUZS ?? 10_000_000;
  const save = Math.round(samplePrice * (PRICING.commission.free - PRICING.commission.pro));

  return (
    <BottomSheet open={!!paywall} onClose={close} z={70} title={<p className="text-[17px] font-bold">{d.mono.paywallTitle}</p>}>
      <p className="text-[13px] leading-snug text-muted">{paywall ? d.mono.reasons[paywall.reason] : d.mono.paywallSub}</p>

      {/* Unlock-with-coins shortcut when the user already has a balance */}
      {paywall?.reason === "unlock" && paywall.itemId && !isPro && (
        <button
          type="button"
          onClick={onUnlockWithCoins}
          className="mt-4 flex h-12 w-full items-center justify-between rounded-lg border border-line-strong px-4 text-[13px]"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Coins size={15} /> {fmt(d.mono.unlockFor, { n: PRICING.unlockCost })}
          </span>
          <span className="font-mono text-muted tabular">{fmt(d.mono.balance, { n: coins })}</span>
        </button>
      )}

      <div className="mt-4 space-y-2" role="radiogroup">
        {plan("monthly", d.mono.monthly, d.mono.perMonth)}
        {plan("yearly", d.mono.yearly, d.mono.perYear)}
        {plan("lifetime", d.mono.lifetime, d.mono.once)}
        <div className="my-3 border-t border-line" />
        {plan("coins_100", `100 ${d.mono.coins}`, d.mono.once)}
        {plan("coins_500", `500 ${d.mono.coins}`, d.mono.once)}
      </div>

      <div className="mt-5 rounded-lg border border-line p-3">
        <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{d.mono.feeTitle}</p>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted">{d.mono.feeFree}</span>
          <span className="font-mono tabular">{formatUZS(Math.round(samplePrice * PRICING.commission.free), lang)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[13px] font-semibold">
          <span>{d.mono.feePro}</span>
          <span className="font-mono tabular">{formatUZS(Math.round(samplePrice * PRICING.commission.pro), lang)}</span>
        </div>
        <p className="mt-2 text-[11px] text-muted">{fmt(d.mono.youSave, { sum: formatUZS(save, lang) })}</p>
      </div>

      <Button onClick={onContinue} disabled={!!busy} className="mt-5 w-full">
        {busy ? <Spinner /> : null} {d.mono.continue}
      </Button>
      <button type="button" onClick={restore} className="mt-2 h-10 w-full text-[12px] text-muted">
        {d.mono.restore}
      </button>
      <p className="pb-[env(safe-area-inset-bottom)] text-center text-[11px] text-muted">{d.mono.terms}</p>
    </BottomSheet>
  );
}
