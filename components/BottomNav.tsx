"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Plus, Search, UserRound } from "lucide-react";
import { useApp, useDict } from "@/lib/store";

/** 56px monochrome tab bar. Active = filled icon + foreground text; Sell = solid square. */
export function BottomNav() {
  const d = useDict();
  const path = usePathname();
  const savedCount = useApp((s) => s.saved.length);
  const tabs = [
    { href: "/", label: d.nav.home, Icon: House },
    { href: "/search", label: d.nav.search, Icon: Search },
    { href: "/sell", label: d.nav.sell, Icon: Plus, primary: true },
    { href: "/saved", label: d.nav.saved, Icon: Heart, badge: savedCount },
    { href: "/profile", label: d.nav.profile, Icon: UserRound },
  ];
  return (
    <nav className="pb-safe z-30 shrink-0 border-t border-line bg-bg" aria-label="Main">
      <ul className="grid h-14 grid-cols-5">
        {tabs.map(({ href, label, Icon, primary, badge }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="flex">
              <Link href={href} aria-current={active ? "page" : undefined} className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${active ? "text-fg" : "text-muted"}`}>
                {primary ? (
                  <span className="flex h-8 w-10 items-center justify-center rounded-md bg-fg text-bg">
                    <Icon size={18} strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon size={20} strokeWidth={active ? 2.4 : 1.8} className={active && href === "/saved" ? "fill-current" : ""} />
                    {!!badge && <span className="absolute -top-1 -right-2 min-w-[14px] rounded-[3px] bg-fg px-0.5 text-center font-mono text-[9px] leading-[14px] font-semibold text-bg tabular">{badge > 99 ? "99+" : badge}</span>}
                  </span>
                )}
                <span className={primary ? "sr-only" : "max-w-full truncate"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
