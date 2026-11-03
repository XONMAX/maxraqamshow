"use client";

import { CreditCard, Repeat2, CircleCheck, Wallet, ShieldCheck } from "lucide-react";
import { TypeBadge } from "@/lib/meta";
import { PRICING, useBilling } from "@/lib/billing";
import { useApp, useDict } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { formatUSD, formatUZS, sellerStats } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Avatar, ItemBadges, ItemValue, Rating, Section, Verified } from "../ui";
import { LockedBlur } from "../monetization/LockedBlur";
import { BoostButton } from "../monetization/BoostButton";
import { PriceHistory } from "./PriceHistory";

export function ItemHeader({ item }: { item: Item }) {
  const locked = !useBilling((s) => s.canSee(item.id, item.premium));
  return (
    <div className="flex items-center gap-3">
      <TypeBadge type={item.type} size={36} />
      <div className="min-w-0">
        <LockedBlur itemId={item.id} locked={locked} compact>
          <p className="truncate leading-tight">
            <ItemValue item={item} size="lg" />
          </p>
        </LockedBlur>
        <p className="mt-0.5 text-[11px]">
          <ItemBadges item={item} />
        </p>
      </div>
    </div>
  );
}

const STEP_ICONS = [CreditCard, Repeat2, CircleCheck, Wallet];

export function ItemDetails({ item }: { item: Item }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const isPro = useBilling((s) => s.isPro());
  const locked = !useBilling((s) => s.canSee(item.id, item.premium));
  const stats = sellerStats(item.seller.name);
  const fee = useBilling((s) => s.commissionFor(item.priceUZS));

  return (
    <div>
      <div className="mt-2 flex items-baseline justify-between border-b border-line pb-3">
        <p className="font-mono text-[22px] font-semibold tabular">{formatUZS(item.priceUZS, lang)}</p>
        <p className="font-mono text-[13px] text-muted tabular">≈ {formatUSD(item.priceUSD)}</p>
      </div>

      {item.mine && (
        <div className="mt-3">
          <BoostButton itemId={item.id} size="md" />
        </div>
      )}

      <Section title={d.sheet.description}>
        <LockedBlur itemId={item.id} locked={locked}>
          <p className="text-[14px] leading-relaxed">{d.desc[item.category] ?? d.desc.standard}</p>
        </LockedBlur>
      </Section>

      <Section title={d.sheet.priceHistory} right={<span className="text-[11px] text-muted">{d.sheet.last6}</span>}>
        <div className="rounded-lg border border-line p-3">
          <PriceHistory item={item} lang={lang} />
        </div>
      </Section>

      <Section title={d.sheet.seller}>
        <div className="rounded-lg border border-line p-3">
          <div className="flex items-center gap-3">
            <Avatar name={item.seller.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">{item.seller.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                <Rating value={item.seller.rating} />
                <span>{fmt(d.sheet.deals, { n: stats.deals })}</span>
                <span>{fmt(d.sheet.since, { y: stats.since })}</span>
              </div>
            </div>
            <Verified item={item} label={false} />
          </div>
          {item.seller.contact && (
            <div className="mt-3 border-t border-line pt-3">
              <LockedBlur itemId={item.id} locked={!isPro} compact>
                <p className="font-mono text-[13px]">{item.seller.contact}</p>
              </LockedBlur>
              {!isPro && <p className="mt-1 text-[11px] text-muted">{d.mono.contactLocked}</p>}
            </div>
          )}
        </div>
      </Section>

      <Section title={d.mono.feeTitle}>
        <div className="rounded-lg border border-line p-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted">{isPro ? d.mono.feePro : d.mono.feeFree}</span>
            <span className="font-mono tabular">{formatUZS(fee, lang)}</span>
          </div>
          {!isPro && (
            <p className="mt-1 text-[11px] text-muted">
              {fmt(d.mono.youSave, { sum: formatUZS(Math.round(item.priceUZS * (PRICING.commission.free - PRICING.commission.pro)), lang) })}
            </p>
          )}
        </div>
      </Section>

      <Section title={d.sheet.howItWorks}>
        <ol className="space-y-2.5">
          {d.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line-strong">
                  <Icon size={14} aria-hidden />
                </span>
                <p className="pt-1 text-[13px] leading-snug">{typeof s === "string" ? s : s[item.type]}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex gap-2.5 rounded-lg border border-line p-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold">{d.sheet.escrow}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-muted">{d.sheet.escrowNote}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
