"use client";

import { useCallback } from "react";
import { useApp, useDict, useUI } from "./store";
import type { Item } from "./types";

export function useItemActions(item: Item) {
  const d = useDict();
  const saved = useApp((s) => s.saved.includes(item.id));
  const toggleSavedRaw = useApp((s) => s.toggleSaved);
  const showToast = useUI((s) => s.showToast);
  const openBuy = useUI((s) => s.openBuy);

  const toggleSave = useCallback(() => {
    const added = toggleSavedRaw(item.id);
    showToast(added ? d.card.added : d.card.removed);
    if (added) navigator.vibrate?.(8);
  }, [toggleSavedRaw, item.id, showToast, d]);

  const share = useCallback(async () => {
    const url = `${location.origin}/item/${item.id}`;
    const data = { title: `${item.value} — NikBozor`, text: item.value, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(d.card.linkCopied);
    } catch {
      showToast(url);
    }
  }, [item, showToast, d]);

  const buy = useCallback(() => openBuy(item.id), [openBuy, item.id]);

  return { saved, toggleSave, share, buy };
}
