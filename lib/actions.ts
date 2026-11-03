"use client";

import { useCallback } from "react";
import { useApp, useDict, useUI } from "./store";

export function useItemActions(itemId: string) {
  const d = useDict();
  const saved = useApp((s) => s.saved.includes(itemId));
  const toggleSavedRaw = useApp((s) => s.toggleSaved);
  const showToast = useUI((s) => s.showToast);
  const openBuy = useUI((s) => s.openBuy);
  const openSheet = useUI((s) => s.openSheet);

  const toggleSave = useCallback(() => {
    const added = toggleSavedRaw(itemId);
    showToast(added ? d.card.added : d.card.removed);
  }, [toggleSavedRaw, itemId, showToast, d]);

  const share = useCallback(
    async (value: string) => {
      const url = `${location.origin}/item/${itemId}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: `${value} — NikBozor`, text: value, url });
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
    },
    [itemId, showToast, d],
  );

  const buy = useCallback(() => openBuy(itemId), [openBuy, itemId]);
  const open = useCallback(() => openSheet(itemId), [openSheet, itemId]);

  return { saved, toggleSave, share, buy, open };
}
