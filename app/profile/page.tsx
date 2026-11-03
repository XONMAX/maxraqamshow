"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Coins, Download, LogOut, Moon, RotateCcw, Sun } from "lucide-react";
import { useApp, useDict, useUI } from "@/lib/store";
import { useBilling } from "@/lib/billing";
import { LANGS, fmt } from "@/lib/i18n";
import { formatDate, formatUZS } from "@/lib/format";
import { TypeBadge } from "@/lib/meta";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { TelegramLogin } from "@/components/auth/TelegramLogin";
import { DealDots } from "@/components/deal/DealTimeline";
import { PostRow } from "@/components/ItemCard";
import { Avatar, Button, ItemValue, Pill, Section } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void> }

export default function ProfilePage() {
  const d = useDict();
  const { lang, theme, user, deals, listings, setLang, toggleTheme, setUser, reset } = useApp();
  const isPro = useBilling((s) => s.isPro());
  const expiresAt = useBilling((s) => s.expiresAt);
  const coins = useBilling((s) => s.coins);
  const openPaywall = useBilling((s) => s.openPaywall);
  const toast = useUI((s) => s.showToast);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); setUser(null); };
  const segment = (active: boolean) => `h-9 rounded-md text-[12px] font-semibold ${active ? "bg-fg text-bg" : "text-muted"}`;

  return (
    <>
      <PageHeader title={d.profile.title} />
      <PageBody className="pt-3">
        <div className="rounded-lg border border-line p-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar name={`${user.first_name} ${user.last_name ?? ""}`} src={user.photo_url} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{user.first_name} {user.last_name}</p>
                <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted">{user.username && `@${user.username}`}{user.demo && <Pill>DEMO</Pill>}</p>
              </div>
              <button type="button" onClick={logout} aria-label={d.profile.logout} className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-muted"><LogOut size={15} /></button>
            </div>
          ) : (
            <div>
              <p className="text-[15px] font-semibold">{d.profile.guest}</p>
              <p className="mt-0.5 mb-3 text-[12px] text-muted">{d.profile.loginHint}</p>
              <TelegramLogin />
            </div>
          )}
        </div>

        {/* Membership */}
        <button type="button" onClick={() => openPaywall({ reason: isPro ? "coins" : "upgrade" })} className="mt-2 flex h-14 w-full items-center justify-between rounded-lg border border-line px-3 text-left">
          <span className="flex items-center gap-2">
            <Pill solid={isPro}>{d.mono.pro}</Pill>
            <span className="text-[13px] font-semibold">{isPro ? (expiresAt ? fmt(d.mono.proUntil, { d: formatDate(expiresAt, lang) }) : d.mono.proActive) : d.mono.paywallTitle}</span>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] text-muted tabular"><Coins size={12} /> {coins}<ChevronRight size={14} /></span>
        </button>

        <Section title={d.deal.myDeals}>
          {deals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-3 text-center text-[12px] text-muted">{d.profile.noDeals}</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link href={`/deals/${deal.id}`} className="flex h-14 items-center gap-3 px-3">
                    <TypeBadge type={deal.item.type} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate leading-[18px]"><ItemValue item={deal.item} size="sm" /></p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted"><DealDots status={deal.status} />{d.deal.status[deal.status]}</div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[12px] font-semibold tabular">{formatUZS(deal.totalUZS, lang)}</p>
                      <p className="text-[10px] text-muted">{formatDate(deal.createdAt, lang)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={d.profile.myListings}>
          {listings.length === 0 ? (
            <Link href="/sell" className="block rounded-lg border border-dashed border-line p-3 text-center text-[12px] text-muted">{d.profile.noListings} · <span className="font-semibold text-fg">{d.nav.sell} →</span></Link>
          ) : (
            <div className="rounded-lg border border-line">{listings.map((it) => <PostRow key={it.id} item={it} />)}</div>
          )}
        </Section>

        <Section title={d.profile.language}>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-line p-1" role="radiogroup" aria-label={d.profile.language}>
            {LANGS.map((l) => <button key={l.key} type="button" role="radio" aria-checked={lang === l.key} onClick={() => setLang(l.key)} className={segment(lang === l.key)}>{l.label}</button>)}
          </div>
        </Section>

        <Section title={d.profile.theme}>
          <button type="button" role="switch" aria-checked={theme === "dark"} onClick={toggleTheme} className="flex h-12 w-full items-center justify-between rounded-lg border border-line px-3">
            <span className="flex items-center gap-2 text-[13px] font-semibold">{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}{theme === "dark" ? d.profile.dark : d.profile.light}</span>
            <span className={`relative h-6 w-10 rounded-full border ${theme === "dark" ? "border-fg bg-fg" : "border-line-strong"}`}><span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full transition-[left] ${theme === "dark" ? "left-[18px] bg-bg" : "left-0.5 bg-fg"}`} /></span>
          </button>
        </Section>

        <div className="mt-5 space-y-2">
          {installEvt && (
            <Button variant="outline" className="w-full justify-start" onClick={async () => { await installEvt.prompt(); setInstallEvt(null); }}>
              <Download size={15} /> {d.profile.install}
            </Button>
          )}
          <button type="button" onClick={() => { reset(); toast(d.profile.resetDone); }} className="flex h-10 w-full items-center gap-2 px-1 text-[12px] text-muted"><RotateCcw size={13} /> {d.profile.reset}</button>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">{d.profile.about}</p>
      </PageBody>
    </>
  );
}
