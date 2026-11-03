"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, LogOut, Moon, RotateCcw, ShieldCheck, Sun } from "lucide-react";
import { useApp, useDict, useUI } from "@/lib/store";
import { LANGS } from "@/lib/i18n";
import { formatDate, formatUZS } from "@/lib/format";
import { TypeBadge } from "@/lib/meta";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { TelegramLogin } from "@/components/auth/TelegramLogin";
import { DealDots, STATUS_STYLE } from "@/components/deal/DealTimeline";
import { CompactCard } from "@/components/ItemCard";
import { Avatar, ItemValue, Section } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function ProfilePage() {
  const d = useDict();
  const { lang, theme, user, deals, listings, setLang, toggleTheme, setUser, reset } = useApp();
  const toast = useUI((s) => s.showToast);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  return (
    <>
      <PageHeader title={d.profile.title} />
      <PageBody className="pt-4">
        {/* Account */}
        <div className="rounded-3xl border border-line bg-surface p-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar name={`${user.first_name} ${user.last_name ?? ""}`} src={user.photo_url} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-bold">
                  {user.first_name} {user.last_name}
                </p>
                {user.username && <p className="font-mono text-[13px] text-muted">@{user.username}</p>}
                {user.demo && <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">DEMO</p>}
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label={d.profile.logout}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line text-muted"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Avatar name="?" size={52} />
                <div>
                  <p className="text-[17px] font-bold">{d.profile.guest}</p>
                  <p className="text-[13px] leading-snug text-muted">{d.profile.loginHint}</p>
                </div>
              </div>
              <TelegramLogin />
            </div>
          )}
        </div>

        {/* Deals */}
        <Section title={d.deal.myDeals}>
          {deals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-4 text-center text-[13px] text-muted">{d.profile.noDeals}</p>
          ) : (
            <ul className="space-y-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link href={`/deals/${deal.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 active:scale-[0.99]">
                    <TypeBadge type={deal.item.type} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px]">
                        <ItemValue item={deal.item} variant="row" />
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <DealDots status={deal.status} />
                        <span className="truncate text-[11px] font-semibold" style={{ color: STATUS_STYLE[deal.status].color }}>
                          {d.deal.status[deal.status]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[12px] font-semibold tabular">{formatUZS(deal.totalUZS, lang)}</p>
                      <p className="text-[11px] text-muted">{formatDate(deal.createdAt, lang)}</p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Listings */}
        <Section title={d.profile.myListings}>
          {listings.length === 0 ? (
            <Link href="/sell" className="block rounded-2xl border border-dashed border-line p-4 text-center text-[13px] text-muted">
              {d.profile.noListings} · <span className="font-semibold text-fg">{d.nav.sell} →</span>
            </Link>
          ) : (
            <ul className="space-y-3">
              {listings.map((it) => (
                <li key={it.id}>
                  <CompactCard item={it} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Settings */}
        <Section title={d.profile.language}>
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1" role="radiogroup" aria-label={d.profile.language}>
            {LANGS.map((l) => (
              <button
                key={l.key}
                type="button"
                role="radio"
                aria-checked={lang === l.key}
                onClick={() => setLang(l.key)}
                className={`h-11 rounded-xl text-[13px] font-semibold transition-colors ${lang === l.key ? "bg-fg text-bg" : "text-muted"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title={d.profile.theme}>
          <button
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={toggleTheme}
            className="flex h-14 w-full items-center justify-between rounded-2xl border border-line bg-surface px-4"
          >
            <span className="flex items-center gap-3 font-semibold">
              {theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
              {theme === "dark" ? d.profile.dark : d.profile.light}
            </span>
            <span className={`relative h-7 w-12 rounded-full transition-colors ${theme === "dark" ? "bg-[#229ED9]" : "bg-line"}`}>
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${theme === "dark" ? "left-6" : "left-1"}`}
              />
            </span>
          </button>
        </Section>

        <div className="mt-6 space-y-2">
          {installEvt && (
            <button
              type="button"
              onClick={async () => {
                await installEvt.prompt();
                setInstallEvt(null);
              }}
              className="flex h-14 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-left"
            >
              <Download size={19} />
              <span className="flex-1">
                <span className="block font-semibold">{d.profile.install}</span>
                <span className="block text-[12px] text-muted">{d.profile.installHint}</span>
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              reset();
              toast(d.profile.resetDone);
            }}
            className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-[14px] text-muted"
          >
            <RotateCcw size={17} /> {d.profile.reset}
          </button>
        </div>

        <p className="mt-6 flex gap-2 text-[12px] leading-relaxed text-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" /> {d.profile.about}
        </p>
      </PageBody>
    </>
  );
}
