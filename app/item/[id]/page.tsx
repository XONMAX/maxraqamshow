import type { Metadata } from "next";
import { DEMO_ITEMS } from "@/lib/catalog";
import { ItemPageClient } from "./ItemPageClient";

export function generateStaticParams() {
  return DEMO_ITEMS.map((i) => ({ id: i.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = DEMO_ITEMS.find((i) => i.id === id);
  if (!item) return { title: "NikBozor" };
  return {
    title: `${item.value} — $${item.priceUSD.toLocaleString("en-US")} · NikBozor`,
    description: `${item.value} · ${item.priceUZS.toLocaleString("ru-RU")} UZS · escrow-protected on NikBozor`,
  };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItemPageClient id={id} />;
}
