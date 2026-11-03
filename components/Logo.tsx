import Link from "next/link";

/** Three overlapping dots in the three type accents — numbers, Telegram, Instagram. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg-ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F58529" />
          <stop offset=".5" stopColor="#DD2A7B" />
          <stop offset="1" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-fg" />
      <circle cx="11" cy="12" r="5" fill="#10B981" />
      <circle cx="21" cy="12" r="5" fill="#229ED9" />
      <circle cx="16" cy="21" r="5" fill="url(#lg-ig)" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex h-11 items-center gap-2" aria-label="NikBozor">
      <LogoMark />
      <span className="text-[17px] font-extrabold tracking-tight">
        Nik<span className="text-muted">Bozor</span>
      </span>
    </Link>
  );
}
