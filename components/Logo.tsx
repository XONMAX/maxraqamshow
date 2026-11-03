import Link from "next/link";

/** Monochrome mark: three dots in the foreground colour (numbers · Telegram · Instagram). */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="text-fg">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="none" stroke="currentColor" />
      <circle cx="11" cy="12" r="4" fill="currentColor" />
      <circle cx="21" cy="12" r="4" fill="currentColor" />
      <circle cx="16" cy="21" r="4" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex h-11 items-center gap-2" aria-label="NikBozor">
      <LogoMark />
      <span className="text-[15px] font-bold tracking-tight">NikBozor</span>
    </Link>
  );
}
