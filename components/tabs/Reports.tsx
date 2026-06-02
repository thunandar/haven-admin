"use client";

import { useEffect, useState } from "react";
import { AdminHeader, Panel, BarChart, SourcePie, Loading } from "../ui";
import { api, type Overview as OverviewData, type Reports as ReportsData } from "../../lib/api";

export function Reports() {
  const [d, setD] = useState<ReportsData | null>(null);
  const [ov, setOv] = useState<OverviewData | null>(null);
  useEffect(() => { api.reports().then(setD).catch(() => {}); api.overview().then(setOv).catch(() => {}); }, []);
  if (!d || !ov) return <Loading />;
  return (
    <div>
      <AdminHeader t="Reports" sub="Exportable analytics" action={
        <button className="btn btn-outline" onClick={() => window.print()} style={{ padding: "9px 14px", fontSize: 13 }}>Export · Print / PDF</button>
      } />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Panel title="Revenue by source"><SourcePie slices={ov.sources} /></Panel>
        <Panel title={`Avg length of stay · ${d.avgStay} nights`}><BarChart data={ov.revenueSeries.map((s) => ({ label: s.label[0], value: s.value }))} /></Panel>
        <Panel title="Top countries">
          {d.topCountries.map((c) => {
            const max = d.topCountries[0]?.revNum || 1;
            return (
              <div key={c.country} style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px", gap: 14, padding: "10px 0", fontSize: 13, alignItems: "center" }}>
                <span>{c.country}</span>
                <div style={{ height: 4, background: "var(--line-soft)", borderRadius: 999 }}>
                  <div style={{ width: `${(c.revNum / max) * 100}%`, height: "100%", background: "var(--accent)" }} />
                </div>
                <span style={{ textAlign: "right", color: "var(--ink-soft)" }}>{c.rev}</span>
              </div>
            );
          })}
        </Panel>
        <Panel title="Booking lead time">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
            {d.leadTime.map((l) => (
              <div key={l.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr 40px", gap: 12, alignItems: "center", fontSize: 13 }}>
                <span>{l.label}</span>
                <div style={{ height: 6, background: "var(--line-soft)", borderRadius: 999 }}>
                  <div style={{ width: `${l.v}%`, height: "100%", background: "var(--warm)" }} />
                </div>
                <span style={{ textAlign: "right", color: "var(--ink-mute)" }}>{l.v}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
