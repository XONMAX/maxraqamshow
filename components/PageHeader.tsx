"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useDict } from "@/lib/store";

export function PageHeader({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const router = useRouter();
  const d = useDict();
  return (
    <header className="pt-safe z-20 shrink-0 border-b border-line bg-bg/85 px-4 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-1">
        {back && (
          <button
            type="button"
            aria-label={d.sell.back}
            onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-[20px] font-extrabold tracking-tight">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 ${className}`}>{children}</main>;
}
