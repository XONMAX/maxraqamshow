import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BottomNav } from "@/components/BottomNav";
import { STORAGE_KEY } from "@/lib/types";

export const metadata: Metadata = {
  title: "NikBozor — numbers & usernames marketplace",
  description: "Buy and sell phone numbers, Telegram and Instagram usernames with escrow protection.",
  applicationName: "NikBozor",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NikBozor" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07080b",
};

// Applies the saved theme + language before first paint (no light/dark flash).
const bootScript = `try{var s=(JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}").state)||{};var d=document.documentElement;if(s.theme==="light")d.classList.remove("dark");if(s.lang)d.lang=s.lang}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="font-sans">
        <Providers>
          <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-bg sm:border-x sm:border-line">
            <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
