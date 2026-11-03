import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NikBozor — numbers & usernames",
    short_name: "NikBozor",
    description: "Buy and sell phone numbers, Telegram and Instagram usernames with escrow protection.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07080b",
    theme_color: "#07080b",
    lang: "uz",
    categories: ["shopping", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Sell", url: "/sell", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Search", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
