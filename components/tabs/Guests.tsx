"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Panel, KPI, usePaged, Pagination, ScrollX, Avatar, Loading } from "../ui";
import { api, type Guest } from "../../lib/api";

export function GuestsTab() {
  const [guests, setGuests] = useState<Guest[] | null>(null);
  useEffect(() => { api.guests().then(setGuests).catch(() => {}); }, []);
  const pg = usePaged(guests || [], 10);
  const cols = "40px 1.5fr 1fr 0.7fr 0.8fr 0.6fr";
  if (!guests) return <Loading />;
  const repeat = guests.filter((g) => g.stays >= 2).length;
  const avg = guests.length ? (guests.reduce((s, g) => s + Number(g.rating), 0) / guests.length).toFixed(2) : "—";
  return (
    <div>
      <AdminHeader t="Guests" sub="Customer database" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KPI label="All guests" value={String(guests.length)} delta="+18 this month" sparkline={[20, 22, 24, 26, 28, 30, 33]} />
        <KPI label="Repeat guests" value={String(repeat)} delta="+24%" sparkline={[10, 12, 15, 18, 20, 22, 24]} />
        <KPI label="Avg satisfaction" value={avg} delta="+0.04" sparkline={[40, 42, 43, 42, 44, 45, 46]} />
        <KPI label="Cypress tier" value={String(guests.filter((g) => g.tier === "Cypress").length)} delta="Top loyalty" sparkline={[1, 2, 2, 3, 3, 4, 4]} />
      </div>
      <Panel title="Guest directory">
        <ScrollX min={560}>
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "0 0 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", borderBottom: "1px solid var(--line-soft)" }}>
          <div></div><div>Guest</div><div>Country</div><div>Stays</div><div>Lifetime</div><div>Rating</div>
        </div>
        {pg.slice.map((g) => (
          <div key={g.email} style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center", fontSize: 13 }}>
            <Avatar name={g.name} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>{g.name} <span className="chip chip-accent" style={{ padding: "1px 8px", fontSize: 10 }}>{g.tier}</span></div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.email}</div>
            </div>
            <div style={{ color: "var(--ink-soft)" }}>{g.country}</div>
            <div style={{ color: "var(--ink-mute)" }}>{g.stays}</div>
            <div style={{ fontFamily: "var(--serif)" }}>{g.ltvLabel}</div>
            <div><Icons.Star size={12} style={{ color: "var(--warm)", marginRight: 4, verticalAlign: "-2px" }} />{g.rating}</div>
          </div>
        ))}
        </ScrollX>
        <Pagination pg={pg} noun="guests" />
      </Panel>
    </div>
  );
}
