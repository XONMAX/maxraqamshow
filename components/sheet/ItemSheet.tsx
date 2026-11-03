"use client";

import { Heart, Share2, ShoppingBag } from "lucide-react";
import { useCallback } from "react";
import { TYPE_META } from "@/lib/meta";
import { useItemActions } from "@/lib/actions";
import { useDict, useItem, useUI } from "@/lib/store";
import type { Item } from "@/lib/types";
import { BottomSheet } from "./BottomSheet";
import { ItemDetails, ItemHeader } from "./ItemDetails";

export function ItemSheet() {
  const id = useUI((s) => s.sheetId);
  const openSheet = useUI((s) => s.openSheet);
  const item = useItem(id);
  const close = useCallback(() => openSheet(null), [openSheet]);

  return (
    <BottomSheet
      open={!!item}
      onClose={close}
      title={item && <ItemHeader item={item} />}
      footer={item && <BuyBar item={item} />}
    >
      {item && <ItemDetails item={item} />}
    </BottomSheet>
  );
}

export function BuyBar({ item }: { item: Item }) {
  const d = useDict();
  const m = TYPE_META[item.type];
  const { saved, toggleSave, share, buy } = useItemActions(item);
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={toggleSave}
        aria-pressed={saved}
        aria-label={saved ? d.card.saved : d.card.save}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 active:scale-95"
      >
        <Heart size={20} className={saved ? "fill-rose-500 text-rose-500" : ""} />
      </button>
      <button
        type="button"
        onClick={share}
        aria-label={d.card.share}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 active:scale-95"
      >
        <Share2 size={19} />
      </button>
      <button
        type="button"
        onClick={buy}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-semibold text-white active:scale-[0.98]"
        style={{ background: m.bg, boxShadow: `0 10px 24px -12px ${m.glow}` }}
      >
        <ShoppingBag size={18} aria-hidden />
        {d.card.buy}
      </button>
    </div>
  );
}
