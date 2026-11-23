// Small accessible SVG charts fed with real database rows. A data table alternative is rendered for screen readers.
export function DailyChart({ data, label }: { data: { day: string; views: number }[]; label: string }) {
  const W = 700, H = 160, P = 24, max = Math.max(1, ...data.map((d) => d.views)), n = Math.max(1, data.length - 1);
  const x = (i: number) => P + (i / n) * (W - P * 2), y = (v: number) => H - P - (v / max) * (H - P * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.views).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-44 w-full">
        {ticks.map((t) => <g key={t}><line x1={P} x2={W - P} y1={y(t)} y2={y(t)} className="stroke-rule" strokeWidth={1} /><text x={P - 4} y={y(t) + 3} textAnchor="end" className="fill-mute" fontSize="9">{t}</text></g>)}
        <path d={`${line} L${x(data.length - 1)},${H - P} L${x(0)},${H - P} Z`} className="fill-accent/20" />
        <path d={line} className="stroke-accent" fill="none" strokeWidth={2} />
        {data.map((d, i) => <circle key={d.day} cx={x(i)} cy={y(d.views)} r={data.length > 60 ? 1.5 : 3} className="fill-accent"><title>{`${d.day}: ${d.views}`}</title></circle>)}
        {[0, Math.floor(n / 2), data.length - 1].filter((i, k, a) => a.indexOf(i) === k && data[i]).map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-mute" fontSize="9">{data[i].day}</text>)}
      </svg>
      <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.day}><th scope="row">{d.day}</th><td>{d.views}</td></tr>)}</tbody></table>
    </figure>
  );
}
export function BarList({ rows, label }: { rows: { label: string; value: number; href?: string }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul aria-label={label} className="space-y-2">
      {rows.map((r, i) => (
        <li key={i}><div className="flex justify-between gap-3 text-sm"><span className="truncate">{r.href ? <a href={r.href} className="hover:underline">{r.label}</a> : r.label}</span><span className="tabular-nums text-mute">{r.value}</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-band" aria-hidden><div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} /></div></li>))}
    </ul>
  );
}
