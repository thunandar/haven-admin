"use client";

import { useEffect, useState } from "react";
import { AdminHeader, Panel, ScrollX, Modal, ModalHead, MBField, mbInput, Loading } from "../ui";
import { api, type Promo } from "../../lib/api";

export function Promos({ openNew, reload }: { openNew: () => void; reload: number }) {
  const [promos, setPromos] = useState<Promo[] | null>(null);
  useEffect(() => { api.promos().then(setPromos).catch(() => {}); }, [reload]);
  if (!promos) return <Loading />;
  return (
    <div>
      <AdminHeader t="Promotions" sub="Discount codes and packages" action={
        <button className="btn btn-primary" onClick={openNew} style={{ padding: "9px 16px", fontSize: 13 }}>+ New promotion</button>
      } />
      <Panel title="Active campaigns">
        <ScrollX min={640}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1.4fr 0.7fr 1fr 1fr", gap: 16, padding: "0 0 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", borderBottom: "1px solid var(--line-soft)" }}>
          <div>Code</div><div>Campaign</div><div>Status</div><div>Redemptions</div><div>Attributed</div>
        </div>
        {promos.map((p) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "120px 1.4fr 0.7fr 1fr 1fr", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center", fontSize: 13 }}>
            <div style={{ fontFamily: "var(--mono)", padding: "4px 8px", background: "var(--bg-card)", borderRadius: 4, width: "fit-content", fontSize: 11 }}>{p.code}</div>
            <div>{p.title}</div>
            <div><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />{p.status}</span></div>
            <div style={{ color: "var(--ink-mute)" }}>{p.redemptions} redemptions</div>
            <div style={{ fontFamily: "var(--serif)" }}>{p.attributedLabel} attributed</div>
          </div>
        ))}
        </ScrollX>
      </Panel>
    </div>
  );
}

export function NewPromoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ code: "", title: "", status: "Active" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!f.code.trim() || !f.title.trim()) { setErr("A code and title are required."); return; }
    setBusy(true); setErr("");
    try { await api.addPromo(f); onSaved(); onClose(); } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Modal onClose={onClose} width={520}>
      <ModalHead t="New promotion" sub="Discount code" onClose={onClose} />
      <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <MBField label="Code"><input style={{ ...mbInput, fontFamily: "var(--mono)", textTransform: "uppercase" }} value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="AUTUMN30" /></MBField>
        <MBField label="Status">
          <select style={mbInput} value={f.status} onChange={(e) => set("status", e.target.value)}>{["Active", "Scheduled", "Ends Jul 1", "Paused"].map((o) => <option key={o}>{o}</option>)}</select>
        </MBField>
        <MBField label="Campaign description" full><input style={mbInput} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 2nd week half-price · autumn 2026" /></MBField>
        {err && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--warm)" }}>{err}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 26px", borderTop: "1px solid var(--line-soft)" }}>
        <button className="btn btn-outline" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: "10px 22px", fontSize: 13, opacity: busy ? 0.6 : 1 }}>{busy ? "Creating…" : "Create promotion"}</button>
      </div>
    </Modal>
  );
}
