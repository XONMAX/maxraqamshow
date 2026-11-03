"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useApp, useUI } from "@/lib/store";
import { ItemSheet } from "./sheet/ItemSheet";
import { BuySheet } from "./sheet/BuySheet";

export function Providers({ children }: { children: ReactNode }) {
  const theme = useApp((s) => s.theme);
  const lang = useApp((s) => s.lang);
  const hydrated = useUI((s) => s.hydrated);

  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).finally(() => useUI.setState({ hydrated: true }));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.lang = lang;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#07080b" : "#f2f3f6");
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
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="max-w-full truncate rounded-full bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg shadow-xl"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
