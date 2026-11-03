"use client";

import Link from "next/link";
import { Plus, SearchX } from "lucide-react";
import { BRAND_GRADIENT } from "@/lib/meta";
import { useDict } from "@/lib/store";
import { Spinner } from "../ui";

export function LoaderCard({ compact }: { compact?: boolean }) {
  const d = useDict();
  return (
    <div
      className={`flex h-full items-center justify-center gap-2.5 rounded-[28px] border border-dashed border-line text-sm text-muted ${
        compact ? "rounded-2xl" : ""
      }`}
      role="status"
    >
      <Spinner />
      {d.feed.loading}
    </div>
  );
}

export function EndCard({ compact }: { compact?: boolean }) {
  const d = useDict();
  if (compact)
    return (
      <Link
        href="/sell"
        className="flex h-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4"
      >
        <div>
          <p className="text-sm font-semibold">{d.feed.end}</p>
          <p className="text-xs text-muted">{d.feed.endHint}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: BRAND_GRADIENT }}>
          <Plus size={20} />
        </span>
      </Link>
    );
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-line p-8 text-center">
      <p className="text-xl font-bold">{d.feed.end}</p>
      <p className="max-w-[16rem] text-sm text-muted">{d.feed.endHint}</p>
      <Link
        href="/sell"
        className="mt-2 flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold text-white"
        style={{ background: BRAND_GRADIENT }}
      >
        <Plus size={18} /> {d.feed.sellCta}
      </Link>
    </div>
  );
}

export function EmptyFeed() {
  const d = useDict();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted">
      <SearchX size={40} strokeWidth={1.5} />
      <p className="text-sm">{d.feed.empty}</p>
    </div>
  );
}
