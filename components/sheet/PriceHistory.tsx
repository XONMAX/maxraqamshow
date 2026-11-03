"use client";

import { useId, useMemo, useState } from "react";
import { TYPE_META } from "@/lib/meta";
import { monthName, priceHistory, formatUSD } from "@/lib/format";
import type { Item } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

const W = 320;
const H = 120;
const PAD = { t: 14, r: 10, b: 22, l: 10 };

/** Single-series area chart: 8 monthly points, touch/hover crosshair with tooltip, sr-only table fallback. */
export function PriceHistory({ item, lang }: { item: Item; lang: Lang }) {
  const id = useId();
  const m = TYPE_META[item.type];
  const data = useMemo(() => priceHistory(item.id, item.priceUSD), [item.id, item.priceUSD]);
  const [hover, setHover] = useState<number | null>(null);

  const months = useMemo(() => {
    const now = new Date();
    return data.map((_, i) => monthName(now.getMonth() - (data.length - 1 - i), lang));
  }, [data, lang]);

  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.03;
  const x = (i: number) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${H - PAD.b}L${x(0)},${H - PAD.b}Z`;
  const change = ((data.at(-1)! - data[0]) / data[0]) * 100;
  const active = hover ?? data.length - 1;

  const pick = (clientX: number, rect: DOMRect) => {
    const rx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rx - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="font-mono text-[15px] font-bold tabular">
          {formatUSD(data[active])} <span className="text-[12px] font-medium text-muted">{months[active]}</span>
        </p>
        <p className={`font-mono text-[12px] font-semibold tabular ${change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label={`${formatUSD(data[0])} → ${formatUSD(data.at(-1)!)}`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={m.accent} stopOpacity="0.28" />
            <stop offset="1" stopColor={m.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* recessive baseline */}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--line)" strokeWidth="1" />
        <path d={area} fill={`url(#${id}-fill)`} />
        <path d={line} fill="none" stroke={m.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* crosshair */}
        <line x1={x(active)} x2={x(active)} y1={PAD.t - 6} y2={H - PAD.b} stroke="var(--muted)" strokeOpacity="0.5" strokeDasharray="2 3" />
        <circle cx={x(active)} cy={y(data[active])} r="5" fill={m.accent} stroke="var(--surface)" strokeWidth="2" />
        {months.map((mo, i) =>
          i % 2 === 1 || i === months.length - 1 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === months.length - 1 ? "end" : "middle"} fontSize="10" fill="var(--muted)">
              {mo}
            </text>
          ) : null,
        )}
      </svg>
      <table className="sr-only">
        <tbody>
          {data.map((v, i) => (
            <tr key={i}>
              <th scope="row">{months[i]}</th>
              <td>{formatUSD(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
