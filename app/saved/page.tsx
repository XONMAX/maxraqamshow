"use client";

import Link from "next/link";
import { useRef } from "react";
import { Heart } from "lucide-react";
import { useAllItems, useApp, useDict, useUI } from "@/lib/store";
import { PostRow } from "@/components/ItemCard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { useViewportFade } from "@/components/feed/useViewportFade";

export default function SavedPage() {
  const d = useDict();
  const items = useAllItems();
  const saved = useApp((s) => s.saved);
  const hydrated = useUI((s) => s.hydrated);
  const list = saved.map((id) => items.find((i) => i.id === id)).filter((i) => !!i);
  const ref = useRef<HTMLDivElement>(null);
  useViewportFade(ref, [list.length]);

  return (
    <>
      <PageHeader title={<span>{d.saved.title}{list.length > 0 && <span className="ml-1.5 font-mono text-[12px] text-muted">{list.length}</span>}</span>} />
      <div ref={ref} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {hydrated && list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center px-6 text-center">
            <Heart size={24} className="text-muted" />
            <p className="mt-3 text-[14px] font-semibold">{d.saved.empty}</p>
            <p className="mt-1 text-[12px] text-muted">{d.saved.emptyHint}</p>
            <Link href="/" className="mt-4"><Button variant="outline">{d.saved.goFeed}</Button></Link>
          </div>
        ) : (
          list.map((it) => (
            <div key={it.id} data-fade className="fade-blur">
              <PostRow item={it} />
            </div>
          ))
        )}
      </div>
    </>
  );
}
