"use client";

import { PageBody, PageHeader } from "@/components/PageHeader";
import { ItemDetails, ItemHeader } from "@/components/sheet/ItemDetails";
import { BuyBar } from "@/components/sheet/ItemSheet";
import { useDict, useItem, useUI } from "@/lib/store";

/** Shareable item page (target of the Share button). Works for demo items and the user's own listings. */
export function ItemPageClient({ id }: { id: string }) {
  const d = useDict();
  const item = useItem(id);
  const hydrated = useUI((s) => s.hydrated);

  return (
    <>
      <PageHeader title={item ? <ItemHeader item={item} /> : d.appName} back />
      <PageBody>
        {item ? <ItemDetails item={item} /> : hydrated && <p className="mt-10 text-center text-muted">{d.search.empty}</p>}
      </PageBody>
      {item && (
        <div className="shrink-0 border-t border-line bg-bg px-3 py-2">
          <BuyBar item={item} />
        </div>
      )}
    </>
  );
}
