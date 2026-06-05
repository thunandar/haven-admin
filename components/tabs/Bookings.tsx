"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, usePaged, Pagination, ScrollX, StatusPill, Loading } from "../ui";
import { api, money, type Booking } from "../../lib/api";
import { BookingDetailModal } from "../modals";

export function Bookings({ openModal, reload }: { openModal: (t: string) => void; reload: number }) {
  const [data, setData] = useState<{ bookings: Booking[]; counts: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState("all");
  const [channel, setChannel] = useState<"all" | "online" | "manual">("all");
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  // Default to newest-booked-first so a reservation that just came in is the
  // first row Anna sees, not buried under months of old check-ins.
  const [sort, setSort] = useState<"booked" | "checkin" | "checkin-desc">("booked");
  const [from, setFrom] = useState(""); // stay-date range filter (ISO yyyy-mm-dd)
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const load = () => api.bookings().then(setData).catch(() => {});
  useEffect(() => { load(); }, [reload]);

  const cat = (b: Booking) =>
    b.status === "Past" ? "past" : b.status === "Cancelled" ? "cancelled" :
    (b.status === "In-house" || b.status === "Arriving today") ? "inhouse" : "upcoming";
  // A booking is "manual" when a staff member keyed it in (bookedBy set); otherwise it arrived online.
  const channelOf = (b: Booking) => (b.bookedBy ? "manual" : "online");

  const all = data?.bookings || [];
  const roomNames = [...new Set(all.map((b) => b.room))].sort();
  const q = search.trim().toLowerCase();
  const passSearch = (b: Booking) => !q || b.ref.toLowerCase().includes(q) || b.guest.toLowerCase().includes(q) || (b.email || "").toLowerCase().includes(q) || b.room.toLowerCase().includes(q);
  const passChannel = (b: Booking) => channel === "all" || channelOf(b) === channel;
  const passRoom = (b: Booking) => roomFilter === "all" || b.room === roomFilter;
  const passStatus = (b: Booking) => filter === "all" || cat(b) === filter;
  // A booking passes the date range when its stay overlaps it (ISO strings compare correctly).
  const passDates = (b: Booking) => (!from || b.checkout >= from) && (!to || b.checkin <= to);
  const filtered = all.filter((b) => passSearch(b) && passChannel(b) && passRoom(b) && passStatus(b) && passDates(b));
  const sorted = [...filtered].sort((a, z) =>
    sort === "booked" ? Date.parse(z.createdAt) - Date.parse(a.createdAt)
    : sort === "checkin" ? a.checkin.localeCompare(z.checkin)
    : z.checkin.localeCompare(a.checkin));
  const pg = usePaged(sorted, 10);
  // Each filter's counts reflect every OTHER active filter, so the numbers always match what's shown.
  const countFor = (k: string) => all.filter((b) => passSearch(b) && passChannel(b) && passRoom(b) && passDates(b) && (k === "all" || cat(b) === k)).length;
  const channelCount = (c: string) => all.filter((b) => passSearch(b) && passRoom(b) && passStatus(b) && passDates(b) && (c === "all" || channelOf(b) === c)).length;
  const cols = "104px 1.2fr 1.15fr 1fr 0.95fr 0.65fr 0.8fr 64px";
  const tabs: [string, string][] = [["all", "All"], ["upcoming", "Upcoming"], ["inhouse", "In-house"], ["past", "Past"], ["cancelled", "Cancelled"]];
  const channels: [typeof channel, string][] = [["all", "All"], ["online", "Online"], ["manual", "Manual"]];

  const cancel = async (ref: string) => { await api.cancelBooking(ref).catch(() => {}); load(); };

  if (!data) return <Loading />;
  return (
    <div>
      <AdminHeader t="Bookings" sub="All reservations" action={
        <button className="btn btn-primary" onClick={() => openModal("booking")} style={{ padding: "9px 16px", fontSize: 13 }}>+ Manual booking</button>
      } />
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", width: 300, maxWidth: "100%" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)", display: "grid", placeItems: "center", pointerEvents: "none" }}><Icons.Search size={15} /></span>
          <input value={search} onChange={(e) => { setSearch(e.target.value); pg.setPage(1); }} placeholder="Search ref, guest, email or room…" style={{ width: "100%", padding: "9px 12px 9px 34px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }} />
          {search && <button onClick={() => { setSearch(""); pg.setPage(1); }} aria-label="Clear search" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--ink-mute)" }}><Icons.Close size={13} /></button>}
        </div>
        <select value={roomFilter} onChange={(e) => { setRoomFilter(e.target.value); pg.setPage(1); }} style={{ padding: "9px 12px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }}>
          <option value="all">All rooms</option>
          {roomNames.map((rn) => <option key={rn} value={rn}>{rn}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }} title="Show stays within these dates">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); pg.setPage(1); }} aria-label="Stay from" style={{ padding: "8px 10px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: from ? "var(--ink)" : "var(--ink-mute)" }} />
          <span className="mute" style={{ fontSize: 12 }}>→</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); pg.setPage(1); }} aria-label="Stay to" style={{ padding: "8px 10px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: to ? "var(--ink)" : "var(--ink-mute)" }} />
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); pg.setPage(1); }} aria-label="Clear dates" style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--ink-mute)", border: "1px solid var(--line)" }}><Icons.Close size={12} /></button>
          )}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} title="Sort order" style={{ marginLeft: "auto", padding: "9px 12px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }}>
          <option value="booked">Newest booked first</option>
          <option value="checkin">Check-in · earliest</option>
          <option value="checkin-desc">Check-in · latest</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => { setFilter(k); pg.setPage(1); }} className={filter === k ? "chip chip-dark" : "chip"}>{l} · {countFor(k)}</button>
        ))}
        <div style={{ display: "flex", gap: 4, marginLeft: "auto", padding: 3, background: "var(--bg-card)", borderRadius: 9, border: "1px solid var(--line-soft)" }}>
          {channels.map(([k, l]) => (
            <button key={k} onClick={() => { setChannel(k); pg.setPage(1); }} title={k === "manual" ? "Keyed in by staff" : k === "online" ? "Booked by guests online" : "All channels"} style={{
              padding: "5px 11px", borderRadius: 7, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
              background: channel === k ? "var(--bg-elev)" : "transparent",
              color: channel === k ? "var(--ink)" : "var(--ink-mute)",
              boxShadow: channel === k ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}>{l} · {channelCount(k)}</button>
          ))}
        </div>
      </div>
      <ScrollX min={880}>
      <div className="card-clean" style={{ background: "var(--bg-elev)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "14px 20px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", borderBottom: "1px solid var(--line-soft)", background: "var(--bg-card)" }}>
          <div>Ref</div><div>Guest</div><div>Email</div><div>Stay</div><div>Room</div><div>Total</div><div>Status</div><div></div>
        </div>
        {pg.slice.map((b, i) => (
          <div key={b.ref} onClick={() => setDetail(b)} title="View details" style={{ display: "grid", gridTemplateColumns: cols, padding: "13px 20px", fontSize: 13, borderBottom: i < pg.slice.length - 1 ? "1px solid var(--line-soft)" : "none", alignItems: "center", cursor: "pointer" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-mute)" }}>{b.ref}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{b.guest}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", display: "flex", alignItems: "center", gap: 4 }}>
                {b.source === "Website" ? <Icons.Globe size={10} /> : b.source === "Anya chatbot" ? <Icons.Sparkle size={10} /> : <Icons.Users size={10} />}
                <span>{b.source || "Website"}{b.bookedBy ? ` · by ${b.bookedBy}` : ""}</span>
              </div>
            </div>
            <div style={{ color: "var(--ink-soft)", fontSize: 12, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.email || undefined}>{b.email || "—"}</div>
            <div style={{ color: "var(--ink-soft)" }}>{b.stay}</div>
            <div style={{ color: "var(--ink-soft)" }}>{b.room}</div>
            <div style={{ fontFamily: "var(--serif)" }}>{money(b.total)}</div>
            <div><StatusPill status={b.status} color={b.color} /></div>
            <div style={{ textAlign: "right" }}>
              {(b.status === "Confirmed" || b.status === "Arriving today") && (
                <button onClick={(e) => { e.stopPropagation(); cancel(b.ref); }} className="btn-ghost" style={{ fontSize: 11, color: "var(--warm)", padding: "4px 6px" }}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {pg.slice.length === 0 && <div className="mute" style={{ padding: 28, textAlign: "center", fontSize: 13 }}>No bookings in this view.</div>}
      </div>
      </ScrollX>
      <Pagination pg={pg} noun="bookings" />
      {detail && <BookingDetailModal booking={detail} onClose={() => setDetail(null)} onChanged={load} />}
    </div>
  );
}
