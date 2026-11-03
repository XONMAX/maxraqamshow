"use client";

import { BadgeCheck, Star } from "lucide-react";
import type { ReactNode } from "react";
import { TYPE_META } from "@/lib/meta";
import { useDict } from "@/lib/store";
import type { Item } from "@/lib/types";
import { initials } from "@/lib/format";

export function DemoBadge() {
  const d = useDict();
  return (
    <span className="rounded-md border border-amber-500/40 bg-amber-400/10 px-1.5 py-[3px] font-mono text-[10px] leading-none font-bold tracking-wider text-amber-600 dark:text-amber-400">
      {d.card.demo}
    </span>
  );
}

export function YoursBadge() {
  const d = useDict();
  return (
    <span className="rounded-md border border-violet-500/40 bg-violet-500/10 px-1.5 py-[3px] text-[10px] leading-none font-bold text-violet-600 dark:text-violet-300">
      {d.card.yours}
    </span>
  );
}

export function CategoryBadge({ item, small }: { item: Item; small?: boolean }) {
  const d = useDict();
  const m = TYPE_META[item.type];
  return (
    <span
      className={`truncate rounded-full font-semibold ${small ? "px-2 py-[3px] text-[10px]" : "px-2.5 py-1 text-[11px]"}`}
      style={{ background: m.soft, color: m.accent }}
    >
      {d.cats[item.category] ?? item.category}
    </span>
  );
}

export function ItemBadges({ item, small }: { item: Item; small?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <CategoryBadge item={item} small={small} />
      {item.isDemo && <DemoBadge />}
      {item.mine && <YoursBadge />}
    </div>
  );
}

export function Rating({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 tabular ${className}`}>
      <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden />
      {value.toFixed(1)}
    </span>
  );
}

export function Verified({ item, label = true }: { item: Item; label?: boolean }) {
  const d = useDict();
  if (!item.seller.verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: TYPE_META[item.type].accent }}>
      <BadgeCheck size={15} aria-hidden />
      {label ? d.card.verified : <span className="sr-only">{d.card.verified}</span>}
    </span>
  );
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-semibold text-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Value with styled prefix: muted "+998 00" for numbers, accent "@" for usernames. */
export function ItemValue({ item, variant }: { item: Item; variant: "hero" | "row" | "sheet" }) {
  const m = TYPE_META[item.type];
  if (item.type === "phone") {
    const parts = item.value.split(" ");
    const prefix = parts.slice(0, 2).join(" ");
    const body = parts.slice(2).join(" ");
    if (variant === "hero")
      return (
        <span className="flex flex-col items-center font-mono leading-none font-extrabold tracking-tight">
          <span className="mb-2 text-[clamp(16px,6cqw,22px)] font-semibold text-muted">{prefix}</span>
          <span style={{ fontSize: `min(60px, calc(100cqw / ${body.length * 0.62}))` }}>{body}</span>
        </span>
      );
    return (
      <span className="font-mono font-bold tracking-tight whitespace-nowrap">
        <span className="text-[0.72em] font-semibold text-muted">{prefix} </span>
        {body}
      </span>
    );
  }
  const h = item.value.replace(/^@/, "");
  const style =
    variant === "hero" ? { fontSize: `min(64px, calc(100cqw / ${(h.length + 1) * 0.62}))` } : undefined;
  return (
    <span className="font-mono leading-none font-extrabold tracking-tight whitespace-nowrap" style={style}>
      <span style={{ color: m.accent }}>@</span>
      {h}
    </span>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  active,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-fg transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold tracking-wide text-muted uppercase">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current border-r-transparent"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
