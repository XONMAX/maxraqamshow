import { Phone } from "lucide-react";
import { SiInstagram, SiTelegram } from "react-icons/si";
import type { ComponentType } from "react";
import type { ItemType } from "./types";

export const IG_GRADIENT = "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)";
export const BRAND_GRADIENT = "linear-gradient(135deg, #10B981 0%, #229ED9 50%, #DD2A7B 100%)";

interface TypeMeta {
  accent: string; // solid colour (text, icons, rings)
  bg: string; // fill for buttons/badges (gradient for Instagram)
  soft: string; // translucent tint
  glow: string; // shadow glow
  Icon: ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;
}

export const TYPE_META: Record<ItemType, TypeMeta> = {
  phone: {
    accent: "#10B981",
    bg: "#10B981",
    soft: "rgba(16,185,129,0.14)",
    glow: "rgba(16,185,129,0.45)",
    Icon: Phone,
  },
  telegram: {
    accent: "#229ED9",
    bg: "#229ED9",
    soft: "rgba(34,158,217,0.14)",
    glow: "rgba(34,158,217,0.45)",
    Icon: SiTelegram,
  },
  instagram: {
    accent: "#DD2A7B",
    bg: IG_GRADIENT,
    soft: "rgba(221,42,123,0.14)",
    glow: "rgba(221,42,123,0.45)",
    Icon: SiInstagram,
  },
};

/** Icon tile: white glyph on the type's accent fill. Used in the top-left of every card. */
export function TypeBadge({ type, size = 40 }: { type: ItemType; size?: number }) {
  const m = TYPE_META[type];
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[30%] text-white shadow-sm"
      style={{ width: size, height: size, background: m.bg, boxShadow: `0 6px 18px -6px ${m.glow}` }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.4} />
    </span>
  );
}

/** Bare icon in the type's accent colour (Instagram gets its gradient via an SVG-free mask trick). */
export function TypeGlyph({ type, size = 18 }: { type: ItemType; size?: number }) {
  const m = TYPE_META[type];
  const Icon = m.Icon;
  return (
    <span style={{ color: m.accent }} className="inline-flex" aria-hidden>
      <Icon size={size} strokeWidth={2.4} />
    </span>
  );
}
