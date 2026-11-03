"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Plus, Search, UserRound } from "lucide-react";
import { BRAND_GRADIENT } from "@/lib/meta";
import { useApp, useDict } from "@/lib/store";

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
    <nav className="pb-safe z-30 shrink-0 border-t border-line bg-bg/90 backdrop-blur-xl" aria-label="Main">
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ href, label, Icon, primary, badge }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors ${
                  active ? "text-fg" : "text-muted"
                }`}
              >
                {primary ? (
                  <span
                    className="-mt-1 flex h-10 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition active:scale-95"
                    style={{ background: BRAND_GRADIENT, boxShadow: "0 8px 22px -10px rgba(34,158,217,.7)" }}
                  >
                    <Icon size={22} strokeWidth={2.6} />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon size={22} strokeWidth={active ? 2.4 : 2} className={active && href === "/saved" ? "fill-current" : ""} />
                    {!!badge && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] leading-[18px] font-bold text-white tabular">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                )}
                <span className={primary ? "sr-only" : "max-w-full truncate px-0.5"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
