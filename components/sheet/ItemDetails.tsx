"use client";

import { CreditCard, ShieldCheck, Repeat2, CircleCheck, Wallet } from "lucide-react";
import { TYPE_META, TypeBadge } from "@/lib/meta";
import { useApp, useDict } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { currency, formatUSD, group, sellerStats } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Avatar, ItemBadges, ItemValue, Rating, Section, Verified } from "../ui";
import { PriceHistory } from "./PriceHistory";

export function ItemHeader({ item }: { item: Item }) {
  return (
    <div className="flex items-center gap-3">
      <TypeBadge type={item.type} size={44} />
      <div className="min-w-0">
        <p className="truncate text-[22px] leading-tight">
          <ItemValue item={item} variant="sheet" />
        </p>
        <div className="mt-1">
          <ItemBadges item={item} small />
        </div>
      </div>
    </div>
  );
}

const STEP_ICONS = [CreditCard, Repeat2, CircleCheck, Wallet];

/** Body of the details sheet — also reused by the /item/[id] share page. */
export function ItemDetails({ item }: { item: Item }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const m = TYPE_META[item.type];
  const stats = sellerStats(item.seller.name);
  const desc = d.desc[item.category] ?? d.desc.standard;

  return (
    <div>
      <div className="mt-2 rounded-2xl p-4" style={{ background: m.soft }}>
        <p className="font-mono text-[26px] leading-tight font-extrabold tabular">
          {group(item.priceUZS)} <span className="font-sans text-[15px] font-semibold text-muted">{currency(lang)}</span>
        </p>
        <p className="font-mono text-[14px] text-muted tabular">≈ {formatUSD(item.priceUSD)}</p>
      </div>

      <Section title={d.sheet.description}>
        <p className="text-[15px] leading-relaxed text-fg/90">{desc}</p>
      </Section>

      <Section title={d.sheet.priceHistory} right={<span className="text-[12px] text-muted">{d.sheet.last6}</span>}>
        <div className="rounded-2xl border border-line p-3">
          <PriceHistory item={item} lang={lang} />
        </div>
      </Section>

      <Section title={d.sheet.seller}>
        <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
          <Avatar name={item.seller.name} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{item.seller.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted">
              <Rating value={item.seller.rating} className="text-fg" />
              <span>{fmt(d.sheet.deals, { n: stats.deals })}</span>
              <span>{fmt(d.sheet.since, { y: stats.since })}</span>
            </div>
          </div>
          <Verified item={item} label={false} />
        </div>
      </Section>

      <Section title={d.sheet.howItWorks}>
        <ol className="relative space-y-3">
          {d.steps.map((s, i) => {
            const text = typeof s === "string" ? s : s[item.type];
            const Icon = STEP_ICONS[i];
            return (
              <li key={i} className="flex gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.soft, color: m.accent }}
                >
                  <Icon size={18} aria-hidden />
                </span>
                <p className="pt-1.5 text-[14px] leading-snug">
                  <span className="mr-1 font-mono font-bold text-muted">{i + 1}.</span>
                  {text}
                </p>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
          <div>
            <p className="text-[14px] font-semibold">{d.sheet.escrow}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted">{d.sheet.escrowNote}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
