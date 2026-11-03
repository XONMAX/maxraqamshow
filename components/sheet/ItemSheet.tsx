"use client";

import { Heart, Share2 } from "lucide-react";
import { useCallback } from "react";
import { useItemActions } from "@/lib/actions";
import { useDict, useItem, useUI } from "@/lib/store";
import type { Item } from "@/lib/types";
import { BottomSheet } from "./BottomSheet";
import { ItemDetails, ItemHeader } from "./ItemDetails";
import { Button } from "../ui";

export function ItemSheet() {
  const id = useUI((s) => s.sheetId);
  const openSheet = useUI((s) => s.openSheet);
  const item = useItem(id);
  const close = useCallback(() => openSheet(null), [openSheet]);
  return (
    <BottomSheet open={!!item} onClose={close} title={item && <ItemHeader item={item} />} footer={item && <BuyBar item={item} />}>
      {item && <ItemDetails item={item} />}
    </BottomSheet>
  );
}

export function BuyBar({ item }: { item: Item }) {
  const d = useDict();
  const { saved, toggleSave, share, buy } = useItemActions(item.id);
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={toggleSave} className="w-11 px-0" aria-pressed={saved}>
        <Heart size={16} className={saved ? "fill-current" : ""} />
      </Button>
      <Button variant="outline" onClick={() => share(item.value)} className="w-11 px-0">
        <Share2 size={16} />
      </Button>
      <Button onClick={buy} className="flex-1">
        {d.card.buy}
      </Button>
    </div>
  );
}
