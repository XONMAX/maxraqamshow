"use client";

import { useEffect, useRef } from "react";
import { SiTelegram } from "react-icons/si";
import { useApp, useDict, useUI } from "@/lib/store";
import type { User } from "@/lib/types";

const BOT = process.env.NEXT_PUBLIC_TG_BOT_USERNAME;

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, string | number>) => void;
  }
}

/**
 * Telegram Login Widget. The widget returns a signed payload; we send it to
 * /api/auth/telegram, which verifies the HMAC with the bot token before trusting it.
 * Without a configured bot, a demo login button is shown so the app stays usable.
 */
export function TelegramLogin({ onDone }: { onDone?: () => void }) {
  const d = useDict();
  const lang = useApp((s) => s.lang);
  const setUser = useApp((s) => s.setUser);
  const toast = useUI((s) => s.showToast);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BOT || !ref.current) return;
    window.onTelegramAuth = async (payload) => {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { user } = (await res.json()) as { user: User };
        setUser(user);
        toast(d.misc.loginOk);
        onDone?.();
      } catch {
        toast(d.misc.loginFail);
      }
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", BOT);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "14");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-lang", lang);
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    const host = ref.current;
    host.innerHTML = "";
    host.appendChild(s);
    return () => {
      host.innerHTML = "";
    };
  }, [lang, setUser, toast, d, onDone]);

  const demoLogin = () => {
    setUser({ id: "demo", first_name: "Demo", last_name: "User", username: "demo_user", demo: true });
    toast(d.misc.loginOk);
    onDone?.();
  };

  return (
    <div className="flex flex-col items-stretch gap-2.5">
      {BOT ? (
        <div ref={ref} className="flex min-h-11 justify-center" />
      ) : (
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-center text-[12px] text-muted">{d.profile.widgetMissing}</p>
      )}
      <button
        type="button"
        onClick={demoLogin}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#229ED9] px-4 text-center font-semibold text-white active:scale-[0.98]"
      >
        <SiTelegram size={18} aria-hidden />
        {d.profile.demoLogin}
      </button>
    </div>
  );
}
