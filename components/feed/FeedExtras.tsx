"use client";

import Link from "next/link";
import { Plus, SearchX } from "lucide-react";
import { useDict } from "@/lib/store";
import { Spinner } from "../ui";

export function LoaderRow() {
  const d = useDict();
  return (
    <div className="flex h-full items-center justify-center gap-2 text-[12px] text-muted" role="status">
      <Spinner size={14} /> {d.feed.loading}
    </div>
  );
}

export function EndRow() {
  const d = useDict();
  return (
    <Link href="/sell" className="flex h-full items-center justify-between px-3 text-[12px] text-muted">
      <span>{d.feed.end}</span>
      <span className="inline-flex items-center gap-1 font-semibold text-fg">
        <Plus size={13} /> {d.feed.sellCta}
      </span>
    </Link>
  );
}

export function EmptyFeed() {
  const d = useDict();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted">
      <SearchX size={28} strokeWidth={1.5} />
      <p className="text-[13px]">{d.feed.empty}</p>
    </div>
  );
}
