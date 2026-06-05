"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Loading } from "../ui";
import { api, type Room } from "../../lib/api";

type RoomSort = "order" | "priceDesc" | "priceAsc" | "mostBooked" | "leastBooked";
const ROOM_SORTS: Record<RoomSort, (a: Room, b: Room) => number> = {
  order: () => 0, // keep the API's custom display order
  priceDesc: (a, b) => b.price - a.price,
  priceAsc: (a, b) => a.price - b.price,
  mostBooked: (a, b) => b.bookedThisWeek - a.bookedThisWeek,
  leastBooked: (a, b) => a.bookedThisWeek - b.bookedThisWeek,
};

export function RoomsInv({ openModal, openRoom, reload }: { openModal: (t: string) => void; openRoom: (r: Room) => void; reload: number }) {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<RoomSort>("order");
  useEffect(() => { api.rooms().then(setRooms).catch(() => {}); }, [reload]);
  if (!rooms) return <Loading />;
  const q = search.trim().toLowerCase();
  const shown = rooms
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.bed.toLowerCase().includes(q))
    .sort(ROOM_SORTS[sort]);
  return (
    <div>
      <AdminHeader t="Rooms & inventory" sub="Property setup" action={
        <button className="btn btn-primary" onClick={() => openModal("addRoom")} style={{ padding: "9px 16px", fontSize: 13 }}>+ Add room</button>
      } />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)", display: "grid", placeItems: "center", pointerEvents: "none" }}><Icons.Search size={15} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room or bed type…" style={{ width: "100%", padding: "9px 12px 9px 34px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }} />
          {search && <button onClick={() => setSearch("")} aria-label="Clear search" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--ink-mute)" }}><Icons.Close size={13} /></button>}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as RoomSort)} title="Sort rooms" style={{ padding: "9px 12px", fontSize: 13, borderRadius: 9, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)" }}>
          <option value="order">Custom order</option>
          <option value="priceDesc">Price · high to low</option>
          <option value="priceAsc">Price · low to high</option>
          <option value="mostBooked">Most booked · May</option>
          <option value="leastBooked">Least booked · May</option>
        </select>
        {q && <span style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>{shown.length} of {rooms.length} rooms</span>}
      </div>
      {shown.length === 0 ? (
        <div className="card-clean" style={{ background: "var(--bg-elev)", padding: "36px 24px", textAlign: "center", marginBottom: 28, fontSize: 13.5, color: "var(--ink-mute)" }}>
          No rooms match &ldquo;{search}&rdquo;. <button onClick={() => setSearch("")} style={{ color: "var(--accent-deep)", textDecoration: "underline" }}>Clear search</button>
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 28 }}>
        {shown.map((r) => (
          <button key={r.id} onClick={() => openRoom(r)} className="card-clean" style={{ background: "var(--bg-elev)", padding: 16, textAlign: "left", display: "block" }}>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <div className="photo" style={{ height: 150, backgroundImage: `url(${r.gallery[0]})`, borderRadius: 12 }} />
              <span style={{ position: "absolute", right: 10, bottom: 10, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#fff", background: "rgba(15,23,19,0.6)", padding: "4px 9px", borderRadius: 999 }}><Icons.Grid size={11} /> {r.gallery.length} photos</span>
            </div>
            <div className="serif" style={{ fontSize: 19, lineHeight: 1.15 }}>{r.name}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 5 }}>{r.bed} bed · sleeps {r.sleeps}</div>
            <span style={{ display: "inline-block", marginTop: 10, fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 999, background: r.bookedThisWeek > 0 ? "var(--accent-soft)" : "var(--bg-card)", color: r.bookedThisWeek > 0 ? "var(--accent-deep)" : "var(--ink-mute)", border: r.bookedThisWeek > 0 ? "none" : "1px solid var(--line-soft)" }}>
              {r.bookedThisWeek > 0 ? `${r.bookedThisWeek} night${r.bookedThisWeek > 1 ? "s" : ""} booked in May` : "No nights booked in May"}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span style={{ fontSize: 14 }}><strong className="serif" style={{ fontSize: 18 }}>${r.price}</strong> <span style={{ color: "var(--ink-mute)", fontSize: 12 }}>/night</span></span>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "inline-flex", alignItems: "center", gap: 4 }}>View gallery <Icons.ChevronRight size={13} /></span>
            </div>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
