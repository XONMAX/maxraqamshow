"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useApp, useUI } from "@/lib/store";
import { useBilling } from "@/lib/billing";
import { Paywall } from "./monetization/Paywall";
import { ItemSheet } from "./sheet/ItemSheet";
import { BuySheet } from "./sheet/BuySheet";

export function Providers({ children }: { children: ReactNode }) {
  const theme = useApp((s) => s.theme);
  const lang = useApp((s) => s.lang);
  const hydrated = useUI((s) => s.hydrated);

  useEffect(() => {
    Promise.all([useApp.persist.rehydrate(), useBilling.persist.rehydrate()]).finally(() => useUI.setState({ hydrated: true }));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.lang = lang;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
  }, [theme, lang, hydrated]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* Fade in once persisted prefs (language, saved, view mode) are loaded — avoids a flash of defaults. */}
      <div className="transition-opacity duration-200" style={{ opacity: hydrated ? 1 : 0 }}>
        {children}
      </div>
      <ItemSheet />
      <BuySheet />
      <Paywall />
      <Toast />
    </MotionConfig>
  );
}

function Toast() {
  const toast = useUI((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useUI.setState({ toast: null }), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-full truncate rounded-md bg-fg px-3 py-2 text-[12px] font-semibold text-bg"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
