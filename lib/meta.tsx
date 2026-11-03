import { Phone } from "lucide-react";
import { SiInstagram, SiTelegram } from "react-icons/si";
import type { ComponentType } from "react";
import type { ItemType } from "./types";

/**
 * Monochrome type metadata. Types are distinguished by icon and label only;
 * there are no per-type accent colours in the design system.
 */
export const TYPE_META: Record<ItemType, { Icon: ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }> }> = {
  phone: { Icon: Phone },
  telegram: { Icon: SiTelegram },
  instagram: { Icon: SiInstagram },
};

/** Small square icon tile: 1px border, foreground glyph. */
export function TypeBadge({ type, size = 28 }: { type: ItemType; size?: number }) {
  const Icon = TYPE_META[type].Icon;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border border-line-strong text-fg"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
  );
}

export function TypeGlyph({ type, size = 16 }: { type: ItemType; size?: number }) {
  const Icon = TYPE_META[type].Icon;
  return (
    <span className="inline-flex text-fg" aria-hidden>
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
