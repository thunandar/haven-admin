"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Panel, ScrollX, Loading } from "../ui";
import { api, type Pricing as PricingData } from "../../lib/api";
import { toast } from "../../lib/toast";

export function Pricing() {
  const [d, setD] = useState<PricingData | null>(null);
  const [acted, setActed] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { api.pricing().then(setD).catch(() => setD({ enabled: true, suggestions: [] })); }, []);
  if (!d) return <Loading />;

  const approve = async (id: string, roomId: string, target: number) => {
    setBusy(id);
    try {
      const r = await api.approvePrice(roomId, target);
      setActed((p) => ({ ...p, [id]: "ok" }));
      toast(`New rate live — $${r.was.toLocaleString("en-US")} → $${r.price.toLocaleString("en-US")}/night.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't apply that price.", "error");
    } finally {
      setBusy(null);
    }
  };

  const pending = d.suggestions.filter((s) => !acted[s.id]);

  return (
    <div>
      <AdminHeader t="Pricing" sub="Base rates and dynamic adjustments" />
      <div style={{ marginBottom: 20, padding: 18, background: "var(--ink)", color: "var(--bg)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icons.Sparkle size={18} stroke={2} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Dynamic pricing by Anya is <span style={{ color: "#90D7B2" }}>ON</span></div>
            <div style={{ fontSize: 12, color: "#A6A099", marginTop: 2 }}>Anya reviews demand from your live bookings and suggests rate changes. You approve before they go live.</div>
          </div>
        </div>
        <button className="btn" onClick={() => toast("Suggestions are recomputed from your live booking data each time you open this page.")} style={{ background: "var(--bg)", color: "var(--ink)", padding: "8px 16px", fontSize: 12 }}>Configure</button>
      </div>
      <Panel title="Pending suggestions">
        {d.suggestions.length === 0 ? (
          <div className="mute" style={{ fontSize: 13, padding: "12px 0" }}>No rate changes suggested — current pricing matches demand across the next few months.</div>
        ) : pending.length === 0 ? (
          <div className="mute" style={{ fontSize: 13, padding: "12px 0" }}>All caught up — every suggestion has been actioned.</div>
        ) : (
        <ScrollX min={640}>
        {pending.map((s) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr auto", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center", fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{s.room}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{s.when}</div>
            </div>
            <div style={{ fontFamily: "var(--serif)" }}>{s.change}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{s.why}</div>
            <div style={{ color: s.positive ? "var(--accent)" : "var(--warm)", fontWeight: 500 }}>{s.lift} est.</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => approve(s.id, s.roomId, s.target)} disabled={busy === s.id} className="btn btn-accent" style={{ padding: "6px 12px", fontSize: 11, opacity: busy === s.id ? 0.6 : 1 }}>{busy === s.id ? "Applying…" : "Approve"}</button>
              <button onClick={() => setActed((p) => ({ ...p, [s.id]: "skip" }))} className="btn-ghost" style={{ fontSize: 11, padding: "6px 10px" }}>Skip</button>
            </div>
          </div>
        ))}
        </ScrollX>
        )}
      </Panel>
    </div>
  );
}
