"use client";

import { useEffect, useState } from "react";
import { AdminHeader, Panel, ScrollX, Modal, ModalHead, MBField, mbInput, Loading } from "../ui";
import { api, type Promo } from "../../lib/api";

// Status is derived server-side from the campaign's date window vs today —
// hoteliers set dates (and pause/resume); they never pick a status by hand.
const STATUS_DOT: Record<Promo["status"], string> = {
  Active: "var(--accent)",
  Scheduled: "var(--warm)",
  Expired: "var(--ink-mute)",
  Paused: "var(--ink-mute)",
};

const GRID = { display: "grid", gridTemplateColumns: "110px 1.3fr 1fr 0.9fr 0.9fr 86px", gap: 16 } as const;

export function Promos({ openNew, reload }: { openNew: () => void; reload: number }) {
  const [promos, setPromos] = useState<Promo[] | null>(null);
  const [busyId, setBusyId] = useState("");
  useEffect(() => { api.promos().then(setPromos).catch(() => {}); }, [reload]);
  const togglePause = async (p: Promo) => {
    setBusyId(p.id);
    try {
      const updated = await api.pausePromo(p.id, !p.paused);
      setPromos((list) => list?.map((x) => (x.id === p.id ? updated : x)) ?? null);
    } catch { /* leave the row as-is */ }
    setBusyId("");
  };
  if (!promos) return <Loading />;
  return (
    <div>
      <AdminHeader t="Promotions" sub="Discount codes and packages" action={
        <button className="btn btn-primary" onClick={openNew} style={{ padding: "9px 16px", fontSize: 13 }}>+ New promotion</button>
      } />
      <Panel title="Campaigns">
        <ScrollX min={700}>
        <div style={{ ...GRID, padding: "0 0 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", borderBottom: "1px solid var(--line-soft)" }}>
          <div>Code</div><div>Campaign</div><div>Status</div><div>Redemptions</div><div>Attributed</div><div />
        </div>
        {promos.map((p) => {
          const dimmed = p.status === "Expired" || p.status === "Paused";
          return (
          <div key={p.id} style={{ ...GRID, padding: "14px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center", fontSize: 13, opacity: dimmed ? 0.65 : 1 }}>
            <div style={{ fontFamily: "var(--mono)", padding: "4px 8px", background: "var(--bg-card)", borderRadius: 4, width: "fit-content", fontSize: 11 }}>{p.code}</div>
            <div>{p.title}</div>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_DOT[p.status] }} />{p.status}
              </span>
              {p.windowLabel && <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2, paddingLeft: 12 }}>{p.windowLabel}</div>}
            </div>
            <div style={{ color: "var(--ink-mute)" }}>{p.redemptions} redemptions</div>
            <div style={{ fontFamily: "var(--serif)" }}>{p.attributedLabel} attributed</div>
            {/* Expired campaigns are history — pausing them would do nothing. */}
            <div>{p.status !== "Expired" && (
              <button className="btn btn-outline" onClick={() => togglePause(p)} disabled={busyId === p.id}
                style={{ padding: "5px 12px", fontSize: 12, opacity: busyId === p.id ? 0.6 : undefined }}>
                {p.paused ? "Resume" : "Pause"}
              </button>
            )}</div>
          </div>
          );
        })}
        </ScrollX>
      </Panel>
    </div>
  );
}

export function NewPromoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ code: "", title: "", startsAt: "", endsAt: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!f.code.trim() || !f.title.trim()) { setErr("A code and title are required."); return; }
    if (f.startsAt && f.endsAt && f.endsAt < f.startsAt) { setErr("The end date must be after the start date."); return; }
    setBusy(true); setErr("");
    try { await api.addPromo(f); onSaved(); onClose(); } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Modal onClose={onClose} width={520}>
      <ModalHead t="New promotion" sub="Discount code" onClose={onClose} />
      <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <MBField label="Code" full><input style={{ ...mbInput, fontFamily: "var(--mono)", textTransform: "uppercase" }} value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="AUTUMN30" /></MBField>
        <MBField label="Campaign description" full><input style={mbInput} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 2nd week half-price · autumn 2026" /></MBField>
        <MBField label="Starts (optional)"><input type="date" style={mbInput} value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></MBField>
        <MBField label="Ends (optional)"><input type="date" style={mbInput} min={f.startsAt || undefined} value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></MBField>
        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.5 }}>
          Status follows the dates — a future start shows as Scheduled, a passed end date as Expired. Leave both empty to run the offer indefinitely.
        </div>
        {err && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--warm)" }}>{err}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 26px", borderTop: "1px solid var(--line-soft)" }}>
        <button className="btn btn-outline" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: "10px 22px", fontSize: 13, opacity: busy ? 0.6 : 1 }}>{busy ? "Creating…" : "Create promotion"}</button>
      </div>
    </Modal>
  );
}
