"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Icons } from "./icons";

// ---------------- Pagination ----------------
export function usePaged<T>(items: T[], initial = 10) {
  const [perPage, setPerPage] = useState(initial);
  const [page, setPage] = useState(1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * perPage;
  const slice = items.slice(start, start + perPage);
  const setPer = (n: number) => { setPerPage(n); setPage(1); };
  return { slice, page: safePage, setPage, perPage, setPer, total, pages, start, end: Math.min(start + perPage, total) };
}

function pageRange(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(pages - 1, page + 1);
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

const PgBtn = ({ disabled, active, step, onClick, label, children }: { disabled?: boolean; active?: boolean; step?: boolean; onClick?: () => void; label?: string; children: ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-current={active ? "page" : undefined}
    className={"pg-btn" + (active ? " on" : "") + (step ? " pg-step" : "")}
  >{children}</button>
);

type Pg = ReturnType<typeof usePaged>;
export function Pagination({ pg, noun = "rows" }: { pg: Pg; noun?: string }) {
  const { page, pages, perPage, setPage, setPer, total, start, end } = pg;
  return (
    <div className="pg">
      <div className="pg-meta">
        <span className="pg-label">Per page</span>
        <div className="pg-select-wrap">
          <select className="pg-select" value={perPage} onChange={(e) => setPer(Number(e.target.value))} aria-label="Rows per page">
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <Icons.ChevronDown size={14} />
        </div>
        <span className="pg-count">
          {total === 0
            ? <>No {noun}</>
            : <><b>{start + 1}–{end}</b> of <b>{total}</b> {noun}</>}
        </span>
      </div>
      <div className="pg-nav">
        <PgBtn step disabled={page === 1} onClick={() => setPage(page - 1)} label="Previous page"><Icons.ChevronLeft size={15} /> Prev</PgBtn>
        {pageRange(page, pages).map((p, i) =>
          p === "…"
            ? <span key={"e" + i} className="pg-ell">…</span>
            : <PgBtn key={p} active={p === page} onClick={() => setPage(p)} label={`Page ${p}`}>{p}</PgBtn>
        )}
        <PgBtn step disabled={page === pages} onClick={() => setPage(page + 1)} label="Next page">Next <Icons.ChevronRight size={15} /></PgBtn>
      </div>
    </div>
  );
}

// ---------------- Header / Panel / KPI ----------------
export const AdminHeader = ({ t, sub, action }: { t: string; sub: string; action?: ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 24, borderBottom: "1px solid var(--line)", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{sub}</div>
      <h1 className="display-md">{t}</h1>
    </div>
    {action}
  </div>
);

export const Panel = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
  <div className="card-clean" style={{ padding: 22, background: "var(--bg-elev)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
      <h3 className="serif" style={{ fontSize: 18 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

export const KPI = ({ label, value, delta, sparkline }: { label: string; value: string; delta: string; sparkline: number[] }) => {
  const max = Math.max(...sparkline, 1);
  const w = 80, h = 28;
  const path = sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <div className="card-clean" style={{ padding: 18, background: "var(--bg-elev)" }}>
      <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
        <div>
          <div className="serif" style={{ fontSize: 30, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>{delta} vs prev</div>
        </div>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <polyline points={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

// ---------------- Charts ----------------
export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ height: 220, display: "flex", alignItems: "flex-end", gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div title={d.label} style={{ width: "100%", height: `${(d.value / max) * 180}px`, minHeight: 2, background: i === data.length - 1 ? "var(--accent)" : "var(--accent-soft)", borderRadius: "6px 6px 0 0" }} />
          <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SourcePie({ slices }: { slices: { label: string; v: number; c: string }[] }) {
  let acc = 0;
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      <svg viewBox="0 0 36 36" width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--line-soft)" strokeWidth="3.6" />
        {slices.map((s, i) => {
          const o = -acc; acc += s.v;
          return <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={s.c} strokeWidth="3.6" strokeDasharray={`${s.v} ${100 - s.v}`} strokeDashoffset={o} />;
        })}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.c }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{ color: "var(--ink-mute)" }}>{s.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Modal + form fields ----------------
export const mbLabel: CSSProperties = { display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 6, fontWeight: 500 };
export const mbInput: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-card)", fontSize: 14, color: "var(--ink)", fontFamily: "var(--sans)" };

export function Modal({ onClose, children, width = 580 }: { onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,19,0.5)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", display: "grid", placeItems: "center", zIndex: 300, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: "var(--bg-elev)", width: "100%", maxWidth: width, maxHeight: "92vh", overflow: "auto", borderRadius: 18, boxShadow: "var(--shadow-lg)", border: "1px solid var(--line-soft)" }}>
        {children}
      </div>
    </div>
  );
}

export const ModalHead = ({ t, sub, onClose }: { t: string; sub: string; onClose: () => void }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 26px 18px", borderBottom: "1px solid var(--line-soft)", position: "sticky", top: 0, background: "var(--bg-elev)", zIndex: 2 }}>
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{sub}</div>
      <h2 className="serif" style={{ fontSize: 26 }}>{t}</h2>
    </div>
    <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--ink-mute)", border: "1px solid var(--line)" }}><Icons.Close size={16} /></button>
  </div>
);

export const MBField = ({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) => (
  <label style={{ display: "block", gridColumn: full ? "1 / -1" : "auto" }}>
    <span style={mbLabel}>{label}</span>
    {children}
  </label>
);

export const initials = (n: string) => n.split(" ").filter((x) => /[A-Za-zÀ-ÿ]/.test(x[0])).slice(0, 2).map((x) => x[0]).join("");

// Wrap wide tables so they scroll horizontally on narrow screens instead of squashing.
export const ScrollX = ({ children, min = 640 }: { children: ReactNode; min?: number }) => (
  <div className="scroll-x" style={{ margin: "0 -2px", padding: "0 2px" }}>
    <div style={{ minWidth: min }}>{children}</div>
  </div>
);

// Centered placeholder shown while a tab loads its data.
export const Loading = () => (
  <div style={{ padding: 40, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>Loading…</div>
);

// Initials avatar used in the guests and staff tables.
export const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 12, color: "var(--accent-deep)" }}>
    {initials(name)}
  </div>
);

// Booking status pill — colour follows the API's status colour (accent / warm / mute).
export const StatusPill = ({ status, color }: { status: string; color: string }) => (
  <span style={{
    padding: "3px 9px", borderRadius: 999, fontSize: 11,
    background: color === "accent" ? "var(--accent-soft)" : color === "warm" ? "#F5E6DA" : "var(--bg-card)",
    color: color === "accent" ? "var(--accent-deep)" : color === "warm" ? "#82391C" : "var(--ink-mute)",
  }}>{status}</span>
);
