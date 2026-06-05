"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Panel, KPI, BarChart, SourcePie, Loading } from "../ui";
import { api, type AuthUser, type Overview as OverviewData } from "../../lib/api";
import { can } from "../../lib/perms";

export function Overview({ user, openModal, reload }: { user: AuthUser; openModal: (t: string) => void; reload: number }) {
  const [d, setD] = useState<OverviewData | null>(null);
  const [acted, setActed] = useState<Record<string, string>>({});
  const [arrAll, setArrAll] = useState(false);
  const [depAll, setDepAll] = useState(false);
  useEffect(() => { api.overview().then(setD).catch(() => {}); }, [reload]);
  if (!d) return <Loading />;

  const act = (ref: string, kind: string) => setActed((p) => ({ ...p, [ref]: kind }));
  const arrivals = arrAll ? d.arrivals : d.arrivals.slice(0, 4);
  const departures = depAll ? d.departures : d.departures.slice(0, 4);
  const dateLabel = new Date(d.today + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const viewAll = (open: boolean, set: (b: boolean) => void, total: number) => total > 4 ? (
    <button className="btn-ghost" onClick={() => set(!open)} style={{ fontSize: 12, padding: "4px 6px" }}>{open ? "Show less" : `View all · ${total}`}</button>
  ) : null;

  return (
    <div>
      <AdminHeader t={dateLabel} sub="Overview" action={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ padding: "9px 14px", fontSize: 13 }}>Last 30 days</button>
          {can(user, "bookings") && <button className="btn btn-primary" onClick={() => openModal("booking")} style={{ padding: "9px 16px", fontSize: 13 }}>+ Manual booking</button>}
        </div>
      } />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
        <KPI label="Occupancy (30d)" value={d.kpis.occupancy.value} delta={d.kpis.occupancy.delta} sparkline={d.kpis.occupancy.sparkline} />
        <KPI label="Revenue MTD" value={d.kpis.revenue.value} delta={d.kpis.revenue.delta} sparkline={d.kpis.revenue.sparkline} />
        <KPI label="ADR" value={d.kpis.adr.value} delta={d.kpis.adr.delta} sparkline={d.kpis.adr.sparkline} />
        <KPI label="RevPAR" value={d.kpis.revpar.value} delta={d.kpis.revpar.delta} sparkline={d.kpis.revpar.sparkline} />
      </div>

      <div style={{ marginTop: 24, padding: 20, background: "var(--ink)", color: "var(--bg)", borderRadius: 16, display: "flex", gap: 18, alignItems: "flex-start" }}>
        <div className="ai-pill" style={{ flexShrink: 0 }}><Icons.Sparkle size={12} stroke={2} /> Anya</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: "#E4E2D8", lineHeight: 1.55 }}>{d.insight.text}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {can(user, "promos") && <button className="btn" onClick={() => openModal("promo")} style={{ background: "var(--bg)", color: "var(--ink)", padding: "8px 14px", fontSize: 12 }}>Draft promo</button>}
            <span style={{ fontSize: 11, color: "#8A8474", alignSelf: "center" }}>{d.insight.ai ? "Live · Claude" : "Demo insight"}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginTop: 24 }}>
        <Panel title="Revenue by month · 2026"><BarChart data={d.revenueSeries.map((s) => ({ label: s.label[0], value: s.value }))} /></Panel>
        <Panel title="Booking sources"><SourcePie slices={d.sources} /></Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginTop: 18 }}>
        <Panel title={`Arrivals today · ${d.arrivals.length}`} action={viewAll(arrAll, setArrAll, d.arrivals.length)}>
          {d.arrivals.length === 0 && <div className="mute" style={{ fontSize: 13, padding: "8px 0" }}>No arrivals today.</div>}
          {arrivals.map((a) => (
            <div key={a.ref} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 13, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{a.room} · {a.detail}</div>
              </div>
              {acted[a.ref] === "in"
                ? <span style={{ padding: "5px 11px", borderRadius: 999, fontSize: 11, background: "var(--accent-soft)", color: "var(--accent-deep)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.Check size={11} stroke={2} /> Checked in</span>
                : <button onClick={() => act(a.ref, "in")} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 11 }}>Check in</button>}
            </div>
          ))}
        </Panel>
        <Panel title={`Departures today · ${d.departures.length}`} action={viewAll(depAll, setDepAll, d.departures.length)}>
          {d.departures.length === 0 && <div className="mute" style={{ fontSize: 13, padding: "8px 0" }}>No departures today.</div>}
          {departures.map((dep) => {
            const out = acted[dep.ref] === "out";
            return (
              <div key={dep.ref} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 13, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{dep.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{dep.room}</div>
                </div>
                <div style={{ fontSize: 11, color: out ? "var(--accent)" : "var(--warm)" }}>{out ? "Checked out" : dep.status}</div>
                {out
                  ? <span style={{ padding: "5px 11px", borderRadius: 999, fontSize: 11, background: "var(--accent-soft)", color: "var(--accent-deep)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.Check size={11} stroke={2} /> Done</span>
                  : <button onClick={() => act(dep.ref, "out")} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 11 }}>Check out</button>}
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}
