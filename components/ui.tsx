"use client";

import { BadgeCheck, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useDict } from "@/lib/store";
import type { Item } from "@/lib/types";
import { initials } from "@/lib/format";

/** Monochrome pill: 1px border, 10px uppercase mono text. `solid` inverts for emphasis ([PRO]). */
export function Pill({ children, solid, className = "" }: { children: ReactNode; solid?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex h-[18px] shrink-0 items-center rounded-[4px] border px-1.5 font-mono text-[9.5px] leading-none font-semibold tracking-wider uppercase ${
        solid ? "border-fg bg-fg text-bg" : "border-line-strong text-muted"
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function DemoBadge() {
  const d = useDict();
  return <Pill>{d.card.demo}</Pill>;
}

export function ItemBadges({ item }: { item: Item }) {
  const d = useDict();
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate text-[11px] text-muted">{d.cats[item.category] ?? item.category}</span>
      {item.premium && <Pill solid>{d.mono.pro}</Pill>}
      {item.isDemo && <DemoBadge />}
      {item.mine && <Pill>{d.card.yours}</Pill>}
    </span>
  );
}

export function Rating({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 tabular ${className}`}>
      <Star size={11} className="fill-current" aria-hidden />
      {value.toFixed(1)}
    </span>
  );
}

export function Verified({ item, label = true }: { item: Item; label?: boolean }) {
  const d = useDict();
  if (!item.seller.verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-fg">
      <BadgeCheck size={13} aria-hidden />
      {label ? d.card.verified : <span className="sr-only">{d.card.verified}</span>}
    </span>
  );
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover grayscale" style={{ width: size, height: size }} />;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong text-[11px] font-semibold text-fg"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Item value in mono. Prefix (+998 00 / @) is muted so the meaningful part reads first. */
export function ItemValue({ item, size = "md" }: { item: Item; size?: "sm" | "md" | "lg" }) {
  const cls = { sm: "text-[14px]", md: "text-[16px]", lg: "text-[22px]" }[size];
  if (item.type === "phone") {
    const parts = item.value.split(" ");
    return (
      <span className={`font-mono font-semibold tracking-tight whitespace-nowrap ${cls}`}>
        <span className="text-muted">{parts.slice(0, 2).join(" ")} </span>
        {parts.slice(2).join(" ")}
      </span>
    );
  }
  return (
    <span className={`font-mono font-semibold tracking-tight whitespace-nowrap ${cls}`}>
      <span className="text-muted">@</span>
      {item.value.replace(/^@/, "")}
    </span>
  );
}

export function IconButton({ label, onClick, children, active, className = "" }: { label: string; onClick?: () => void; children: ReactNode; active?: boolean; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center text-fg ${className}`}
    >
      {children}
    </button>
  );
}

/** Primary (solid) and secondary (outline) buttons: the only two button styles in the system. */
export function Button({ children, onClick, variant = "primary", disabled, className = "", type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "outline" | "ghost"; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  const v = {
    primary: "bg-fg text-bg border-fg",
    outline: "bg-transparent text-fg border-line-strong",
    ghost: "bg-transparent text-muted border-transparent",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-[14px] font-semibold transition-opacity active:opacity-70 disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="inline-block animate-spin rounded-full border-2 border-current border-r-transparent" style={{ width: size, height: size }} aria-hidden />;
}

export const Divider = () => <hr className="border-line" />;
