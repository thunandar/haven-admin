"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Panel, KPI, usePaged, Pagination, ScrollX, Avatar, Loading } from "../ui";
import { api, type Guest } from "../../lib/api";

const TIERS = ["Cypress", "Sage", "Stone"] as const;

export function GuestsTab() {
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState<"ltv" | "stays" | "rating" | "name">("ltv");
  useEffect(() => { api.guests().then(setGuests).catch(() => {}); }, []);

  const all = guests || [];
  const q = search.trim().toLowerCase();
  const passSearch = (g: Guest) => !q || g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  const passTier = (g: Guest) => tier === "all" || g.tier === tier;
  const filtered = all.filter((g) => passSearch(g) && passTier(g));
  const num = (r: string | null) => (r === null ? -1 : Number(r)); // unrated sorts last
  const sorted = [...filtered].sort((a, z) =>
    sort === "stays" ? z.stays - a.stays :
    sort === "rating" ? num(z.rating) - num(a.rating) :
    sort === "name" ? a.name.localeCompare(z.name) :
    z.ltv - a.ltv);
  // Each tier chip's count reflects the active search, so the numbers always match what's shown.
  const tierCount = (t: string) => all.filter((g) => passSearch(g) && (t === "all" || g.tier === t)).length;
  const hasFilters = q !== "" || tier !== "all";

  const pg = usePaged(sorted, 10);
  const cols = "40px 1.8fr 0.7fr 0.8fr 0.6fr";
  if (!guests) return <Loading />;
  const repeat = guests.filter((g) => g.stays >= 2).length;
  // Satisfaction comes from guests who actually left a review.
  const rated = guests.filter((g) => g.rating !== null);
  const avg = rated.length ? (rated.reduce((s, g) => s + Number(g.rating), 0) / rated.length).toFixed(2) : "—";
  return (
    <div>
      <AdminHeader t="Guests" sub="Customer database" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KPI label="All guests" value={String(guests.length)} delta="+4 this month" sparkline={[20, 22, 24, 26, 28, 30, 33]} />
        <KPI label="Repeat guests" value={String(repeat)} delta="+24%" sparkline={[10, 12, 15, 18, 20, 22, 24]} />
        <KPI label="Avg satisfaction" value={avg} delta="+0.04" sparkline={[40, 42, 43, 42, 44, 45, 46]} />
        <KPI label="Cypress tier" value={String(guests.filter((g) => g.tier === "Cypress").length)} delta="Top loyalty" sparkline={[1, 2, 2, 3, 3, 4, 4]} />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", width: 300, maxWidth: "100%" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)", display: "grid", placeItems: "center", pointerEvents: "none" }}><Icons.Search size={15} /></span>
          <input value={search} onChange={(e) => { setSearch(e.target.value); pg.setPage(1); }} placeholder="Search name or email…" style={{ width: "100%", padding: "9px 12px 9px 34px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }} />
          {search && <button onClick={() => { setSearch(""); pg.setPage(1); }} aria-label="Clear search" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--ink-mute)" }}><Icons.Close size={13} /></button>}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} title="Sort order" style={{ marginLeft: "auto", padding: "9px 12px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }}>
          <option value="ltv">Lifetime value · highest</option>
          <option value="stays">Stays · most</option>
          <option value="rating">Rating · highest</option>
          <option value="name">Name · A–Z</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", ...TIERS] as const).map((t) => (
          <button key={t} onClick={() => { setTier(t); pg.setPage(1); }} className={tier === t ? "chip chip-dark" : "chip"} title={t === "Cypress" ? "Top loyalty tier · 8+ stays" : t === "Sage" ? "4–7 stays" : t === "Stone" ? "1–3 stays" : "All loyalty tiers"}>
            {t === "all" ? "All tiers" : t} · {tierCount(t)}
          </button>
        ))}
      </div>
      <Panel title="Guest directory">
        <ScrollX min={520}>
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "0 0 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", borderBottom: "1px solid var(--line-soft)" }}>
          <div></div><div>Guest</div><div>Stays</div><div>Lifetime</div><div>Rating</div>
        </div>
        {pg.slice.map((g) => (
          <div key={g.email} style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center", fontSize: 13 }}>
            <Avatar name={g.name} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>{g.name} <span className="chip chip-accent" style={{ padding: "1px 8px", fontSize: 10 }}>{g.tier}</span></div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.email}</div>
            </div>
            <div style={{ color: "var(--ink-mute)" }}>{g.stays}</div>
            <div style={{ fontFamily: "var(--serif)" }}>{g.ltvLabel}</div>
            <div title={g.rating === null ? "No review yet" : "From this guest's reviews"}>
              {g.rating === null
                ? <span style={{ color: "var(--ink-mute)" }}>—</span>
                : <><Icons.Star size={12} style={{ color: "var(--warm)", marginRight: 4, verticalAlign: "-2px" }} />{g.rating}</>}
            </div>
          </div>
        ))}
        {pg.slice.length === 0 && (
          <div className="mute" style={{ padding: 28, textAlign: "center", fontSize: 13 }}>
            No guests match these filters.{" "}
            <button onClick={() => { setSearch(""); setTier("all"); pg.setPage(1); }} style={{ color: "var(--ink)", textDecoration: "underline", fontSize: 13 }}>Clear filters</button>
          </div>
        )}
        </ScrollX>
        <Pagination pg={pg} noun={hasFilters ? "matching guests" : "guests"} />
      </Panel>
    </div>
  );
}
