"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Copy, PartyPopper, ShieldCheck } from "lucide-react";
import { DEMO_ITEMS, detectCategory, digitsOf, handle } from "@/lib/catalog";
import { TYPE_META, TypeBadge } from "@/lib/meta";
import { useAllItems, useApp, useDict, useUI } from "@/lib/store";
import { fmt } from "@/lib/i18n";
import { formatUSD, formatUZS, group, seeded } from "@/lib/format";
import { ESCROW_FEE, USD_RATE, type Item, type ItemType } from "@/lib/types";
import { CompactCard } from "@/components/ItemCard";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { TelegramLogin } from "@/components/auth/TelegramLogin";
import { Spinner } from "@/components/ui";

const TYPES: ItemType[] = ["phone", "telegram", "instagram"];

function formatPhone(digits9: string) {
  const d = digits9.padEnd(9, "_");
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** "001234567" → "00 123 45 67" (partial input formats progressively). */
const phoneDisplay = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");

function validate(type: ItemType, raw: string): "ok" | "invalid" {
  if (type === "phone") return digitsOf(raw).length === 9 ? "ok" : "invalid";
  const h = raw.replace(/^@/, "");
  if (type === "telegram") return /^[a-zA-Z](?!.*__)[a-zA-Z0-9_]{1,30}[a-zA-Z0-9]$/.test(h) ? "ok" : "invalid";
  return /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/.test(h) ? "ok" : "invalid";
}

export default function SellPage() {
  const d = useDict();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const user = useApp((s) => s.user);
  const addListing = useApp((s) => s.addListing);
  const setType = useApp((s) => s.setType);
  const setCategory = useApp((s) => s.setCategory);
  const toast = useUI((s) => s.showToast);
  const all = useAllItems();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [type, setItemType] = useState<ItemType | null>(null);
  const [raw, setRaw] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [price, setPrice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<Item | null>(null);

  const m = type ? TYPE_META[type] : null;
  const value = type === "phone" ? formatPhone(digitsOf(raw).slice(0, 9)) : `@${raw.replace(/^@/, "").toLowerCase()}`;
  const validity = type ? validate(type, raw) : "invalid";
  const taken = useMemo(
    () =>
      type && validity === "ok"
        ? all.some((i) => i.type === type && (type === "phone" ? digitsOf(i.value) === digitsOf(value) : handle(i) === handle({ value })))
        : false,
    [all, type, validity, value],
  );
  const category = type && validity === "ok" ? detectCategory(type, value) : null;
  const verifyCode = useMemo(() => `NB-${Math.floor(1000 + seeded(value)() * 9000)}`, [value]);
  const priceNum = Number(price.replace(/\D/g, "")) || 0;

  const similar = useMemo(() => {
    if (!type || !category) return null;
    const peers = DEMO_ITEMS.filter((i) => i.type === type && i.category === category).map((i) => i.priceUZS).sort((a, b) => a - b);
    return peers.length ? peers[Math.floor(peers.length / 2)] : null;
  }, [type, category]);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const canNext = [!!type, validity === "ok" && !taken, verified, priceNum >= 10000][step] ?? false;

  const runVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      navigator.vibrate?.(12);
    }, 1400);
  };

  const publish = () => {
    if (!type || !category || !user) return;
    setPublishing(true);
    setTimeout(() => {
      const item: Item = {
        id: `my-${Date.now().toString(36)}`,
        type,
        value,
        category,
        priceUZS: priceNum,
        priceUSD: Math.max(1, Math.round(priceNum / USD_RATE)),
        seller: { name: [user.first_name, user.last_name?.[0] && `${user.last_name[0]}.`].filter(Boolean).join(" "), rating: 5, verified: true },
        isDemo: false,
        mine: true,
        createdAt: new Date().toISOString(),
      };
      addListing(item);
      setPublishing(false);
      setDone(item);
      navigator.vibrate?.([10, 40, 10]);
    }, 900);
  };

  const restart = () => {
    setDone(null);
    setItemType(null);
    setRaw("");
    setCode("");
    setVerified(false);
    setPrice("");
    go(0);
  };

  if (done) {
    return (
      <>
        <PageHeader title={d.sell.title} />
        <PageBody>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mt-10 flex flex-col items-center text-center"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-[28px] text-white" style={{ background: TYPE_META[done.type].bg }}>
              <PartyPopper size={36} />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">{d.sell.done}</h2>
            <p className="mt-2 max-w-[18rem] text-[14px] text-muted">{d.sell.doneHint}</p>
          </motion.div>
          <div className="mt-8">
            <CompactCard item={done} />
          </div>
          <div className="mt-6 grid gap-2">
            <button
              type="button"
              onClick={() => {
                setType(done.type);
                setCategory(done.type, "all");
                useApp.getState().setSort("newest");
                router.push("/");
              }}
              className="h-12 rounded-2xl font-semibold text-white"
              style={{ background: TYPE_META[done.type].bg }}
            >
              {d.sell.viewFeed}
            </button>
            <button type="button" onClick={restart} className="h-12 rounded-2xl border border-line font-semibold">
              {d.sell.sellAnother}
            </button>
          </div>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader title={d.sell.title} />
      {/* Stepper */}
      <div className="shrink-0 px-4 pt-3">
        <div className="flex gap-1.5" aria-hidden>
          {d.sell.steps.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: m?.bg ?? "var(--fg)" }}
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] font-semibold text-muted">
          {step + 1}/{d.sell.steps.length} · {d.sell.steps[step]}
        </p>
      </div>

      <PageBody className="pt-2">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div>
                <h2 className="mt-3 mb-4 text-[22px] font-extrabold">{d.sell.chooseType}</h2>
                <div className="grid gap-3" role="radiogroup">
                  {TYPES.map((t) => {
                    const tm = TYPE_META[t];
                    const sel = t === type;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => {
                          if (t !== type) {
                            setRaw("");
                            setVerified(false);
                          }
                          setItemType(t);
                        }}
                        className="flex items-center gap-4 rounded-3xl border-2 bg-surface p-4 text-left transition active:scale-[0.99]"
                        style={{
                          borderColor: sel ? tm.accent : "var(--line)",
                          boxShadow: sel ? `0 16px 40px -24px ${tm.glow}` : undefined,
                        }}
                      >
                        <TypeBadge type={t} size={52} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] font-bold">{d.types[t]}</p>
                          <p className="text-[13px] text-muted">{d.sell.typeHint[t]}</p>
                        </div>
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2"
                          style={sel ? { background: tm.accent, borderColor: tm.accent, color: "#fff" } : { borderColor: "var(--line)" }}
                        >
                          {sel && <Check size={14} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && type && m && (
              <div>
                <h2 className="mt-3 mb-4 text-[22px] font-extrabold">{d.sell.enterItem}</h2>
                <label
                  className="flex h-16 items-center gap-2 rounded-2xl border-2 bg-surface px-4 font-mono text-[22px] font-bold focus-within:ring-4 focus-within:ring-[#229ED9]/20"
                  style={{ borderColor: raw && (validity !== "ok" || taken) ? "#F43F5E" : m.accent }}
                >
                  <span style={{ color: type === "phone" ? "var(--muted)" : m.accent }}>{type === "phone" ? "+998" : "@"}</span>
                  <input
                    autoFocus
                    value={type === "phone" ? phoneDisplay(digitsOf(raw)) : raw}
                    onChange={(e) => {
                      setRaw(type === "phone" ? digitsOf(e.target.value).slice(0, 9) : e.target.value.replace(/^@/, "").replace(/\s/g, "").slice(0, 32));
                      setVerified(false);
                      setCode("");
                    }}
                    inputMode={type === "phone" ? "numeric" : "text"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={type === "phone" ? d.sell.phonePh : d.sell.userPh}
                    aria-label={d.sell.enterItem}
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/50"
                  />
                </label>
                <div className="mt-2 min-h-5 text-[13px]">
                  {raw && validity !== "ok" && (
                    <p className="text-rose-500">{type === "phone" ? d.sell.invalidPhone : type === "telegram" ? d.sell.invalidTg : d.sell.invalidIg}</p>
                  )}
                  {taken && <p className="text-rose-500">{d.sell.taken}</p>}
                </div>
                {category && !taken && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-2 rounded-2xl p-3" style={{ background: m.soft }}>
                    <span className="text-[13px] text-muted">{d.sell.detected}:</span>
                    <span className="rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ color: m.accent, background: "var(--surface)" }}>
                      {d.cats[category]}
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {step === 2 && type && m && (
              <div>
                <h2 className="mt-3 mb-2 text-[22px] font-extrabold">{d.sell.verifyTitle}</h2>
                <p className="text-[14px] leading-relaxed text-muted">
                  {fmt(type === "phone" ? d.sell.verifyPhone : type === "telegram" ? d.sell.verifyTg : d.sell.verifySocial, { v: value })}
                </p>
                {type === "phone" ? (
                  <div className="mt-5">
                    <input
                      value={code}
                      onChange={(e) => {
                        const c = digitsOf(e.target.value).slice(0, 4);
                        setCode(c);
                        if (c.length === 4 && !verified) runVerify();
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="• • • •"
                      aria-label={d.sell.code}
                      className="h-16 w-full rounded-2xl border-2 bg-surface text-center font-mono text-[28px] font-bold tracking-[0.5em] outline-none"
                      style={{ borderColor: m.accent }}
                    />
                    <p className="mt-2 text-[12px] text-amber-600 dark:text-amber-400">{d.sell.demoCode}</p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <p className="mb-1.5 text-[12px] font-semibold text-muted">{d.sell.code}</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(verifyCode).then(() => toast(`${verifyCode} ✓`))}
                      className="flex h-16 w-full items-center justify-between rounded-2xl border-2 border-dashed bg-surface px-4 font-mono text-[24px] font-bold"
                      style={{ borderColor: m.accent }}
                    >
                      {verifyCode}
                      <Copy size={20} className="text-muted" />
                    </button>
                    {!verified && (
                      <button
                        type="button"
                        onClick={runVerify}
                        disabled={verifying}
                        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line font-semibold"
                      >
                        {verifying && <Spinner />} {verifying ? d.sell.checking : d.sell.check}
                      </button>
                    )}
                  </div>
                )}
                {verifying && type === "phone" && (
                  <p className="mt-4 flex items-center gap-2 text-[14px] text-muted">
                    <Spinner /> {d.sell.checking}
                  </p>
                )}
                {verified && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-[14px] font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <ShieldCheck size={20} /> {d.sell.verified}
                  </motion.p>
                )}
              </div>
            )}

            {step === 3 && type && m && (
              <div>
                <h2 className="mt-3 mb-4 text-[22px] font-extrabold">{d.sell.setPrice}</h2>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-muted">{d.sell.priceLabel}</span>
                  <span className="flex h-16 items-center rounded-2xl border-2 bg-surface px-4" style={{ borderColor: m.accent }}>
                    <input
                      autoFocus
                      value={priceNum ? group(priceNum) : ""}
                      onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      inputMode="numeric"
                      placeholder="0"
                      className="min-w-0 flex-1 bg-transparent font-mono text-[26px] font-bold outline-none tabular placeholder:text-muted/50"
                    />
                    <span className="font-mono text-[14px] text-muted tabular">≈ {formatUSD(priceNum / USD_RATE)}</span>
                  </span>
                </label>
                {similar && (
                  <button
                    type="button"
                    onClick={() => setPrice(String(similar))}
                    className="mt-3 h-11 rounded-full px-4 text-[13px] font-semibold"
                    style={{ background: m.soft, color: m.accent }}
                  >
                    {fmt(d.sell.similar, { sum: formatUZS(similar, lang) })}
                  </button>
                )}
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-2 p-4">
                  <span className="text-[13px] text-muted">{d.sell.youGet}</span>
                  <span className="font-mono text-[16px] font-bold tabular">{formatUZS(priceNum * (1 - ESCROW_FEE), lang)}</span>
                </div>
              </div>
            )}

            {step === 4 && type && m && category && (
              <div>
                <h2 className="mt-3 mb-4 text-[22px] font-extrabold">{d.sell.preview}</h2>
                <CompactCard
                  item={{
                    id: "preview",
                    type,
                    value,
                    category,
                    priceUZS: priceNum,
                    priceUSD: Math.round(priceNum / USD_RATE),
                    seller: { name: user?.first_name ?? d.profile.guest, rating: 5, verified: true },
                    isDemo: false,
                    mine: true,
                    createdAt: new Date().toISOString(),
                  }}
                />
                {user ? (
                  <button
                    type="button"
                    onClick={publish}
                    disabled={publishing}
                    className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-bold text-white"
                    style={{ background: m.bg, boxShadow: `0 14px 30px -14px ${m.glow}` }}
                  >
                    {publishing && <Spinner />} {publishing ? d.sell.publishing : d.sell.publish}
                  </button>
                ) : (
                  <div className="mt-6 rounded-2xl border border-line p-4">
                    <p className="mb-3 text-center text-[14px] font-semibold">{d.sell.loginToPublish}</p>
                    <TelegramLogin />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </PageBody>

      {/* Step navigation */}
      {step < 4 && (
        <div className="flex shrink-0 gap-2 border-t border-line bg-bg px-4 py-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              aria-label={d.sell.back}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <button
            type="button"
            disabled={!canNext}
            onClick={() => go(step + 1)}
            className="flex h-12 flex-1 items-center justify-center gap-1 rounded-2xl font-semibold text-white transition disabled:opacity-40"
            style={{ background: m?.bg ?? "var(--fg)", color: m ? "#fff" : "var(--bg)" }}
          >
            {d.sell.next} <ChevronRight size={18} />
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="flex shrink-0 border-t border-line bg-bg px-4 py-3">
          <button type="button" onClick={() => go(3)} className="flex h-12 items-center gap-1 rounded-2xl px-3 font-semibold text-muted">
            <ChevronLeft size={20} /> {d.sell.back}
          </button>
        </div>
      )}
    </>
  );
}
