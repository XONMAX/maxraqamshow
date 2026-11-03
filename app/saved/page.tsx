"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useAllItems, useApp, useDict, useUI } from "@/lib/store";
import { CompactCard } from "@/components/ItemCard";
import { PageBody, PageHeader } from "@/components/PageHeader";

export default function SavedPage() {
  const d = useDict();
  const items = useAllItems();
  const saved = useApp((s) => s.saved);
  const hydrated = useUI((s) => s.hydrated);
  const list = saved.map((id) => items.find((i) => i.id === id)).filter((i) => !!i);

  return (
    <>
      <PageHeader
        title={
          <span>
            {d.saved.title} {list.length > 0 && <span className="text-muted">· {list.length}</span>}
          </span>
        }
      />
      <PageBody className="pt-4">
        {hydrated && list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500">
              <Heart size={28} />
            </span>
            <p className="mt-4 font-semibold">{d.saved.empty}</p>
            <p className="mt-1 max-w-[16rem] text-[13px] text-muted">{d.saved.emptyHint}</p>
            <Link href="/" className="mt-5 flex h-12 items-center rounded-2xl bg-fg px-6 font-semibold text-bg">
              {d.saved.goFeed}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {list.map((it) => (
                <motion.li
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22 }}
                >
                  <CompactCard item={it} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </PageBody>
    </>
  );
}
