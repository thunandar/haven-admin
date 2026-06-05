"use client";

import { useEffect, useState } from "react";
import { AdminHeader, Panel, Loading } from "../ui";
import { useIsMobile } from "../../lib/use-responsive";
import { api, type Room } from "../../lib/api";

// The room-by-room availability calendar, on its own page — the hotelier checks
// this daily, so it shouldn't live below the inventory grid on Rooms.
export function AvailabilityTab({ reload }: { reload: number }) {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  useEffect(() => { api.rooms().then(setRooms).catch(() => {}); }, [reload]);
  if (!rooms) return <Loading />;
  return (
    <div>
      <AdminHeader t="Availability" sub="Room calendar" />
      <Panel title="Availability · May 2026"><Availability rooms={rooms} /></Panel>
    </div>
  );
}

const RmLegend = ({ c, t, open }: { c: string; t: string; open?: boolean }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: c, border: open ? "1px solid var(--line)" : "none" }} />{t}
  </span>
);

function Availability({ rooms }: { rooms: Room[] }) {
  const [sel, setSel] = useState(rooms[0].id);
  const room = rooms.find((r) => r.id === sel) || rooms[0];
  const days = Array.from({ length: room.daysInMonth }, (_, i) => i + 1);
  const mobile = useIsMobile(720);
  const roomList = rooms.map((r) => {
    const on = r.id === sel;
    return (
      <button key={r.id} onClick={() => setSel(r.id)} style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left", padding: 8, borderRadius: 12, border: "1px solid " + (on ? "var(--accent)" : "var(--line-soft)"), background: on ? "var(--accent-soft)" : "var(--bg-card)", flexShrink: 0 }}>
        <div className="photo" style={{ width: 52, height: 52, borderRadius: 8, backgroundImage: `url(${r.gallery[0]})`, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: on ? "var(--accent-deep)" : "var(--ink)" }}>{r.name}</div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>${r.price} · {r.booked.length} nights booked</div>
        </div>
      </button>
    );
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "230px 1fr", gap: 22, alignItems: "stretch" }}>
      {mobile ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>{roomList}</div>
      ) : (
        // The inner scroller is absolutely positioned so it never grows the grid
        // row — the row height is set by the calendar, and the list fills it
        // exactly, scrolling only when there are more rooms than fit.
        <div style={{ position: "relative", minHeight: 0 }}>
          <div style={{ position: "absolute", inset: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 6 }}>{roomList}</div>
        </div>
      )}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div className="serif" style={{ fontSize: 17 }}>{room.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{room.openNights} of {room.daysInMonth} nights open</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((dd, i) => <div key={i} style={{ fontSize: 10, color: "var(--ink-mute)", textAlign: "center" }}>{dd}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {Array.from({ length: 3 }, (_, i) => <div key={"e" + i} />)}
          {days.map((dn) => {
            const arriving = room.arriving.includes(dn);
            const booked = room.booked.includes(dn);
            const blocked = room.blocked.includes(dn);
            return (
              <div key={dn} style={{ aspectRatio: "1", borderRadius: 6, background: arriving ? "var(--warm)" : booked ? "var(--accent)" : blocked ? "var(--ink)" : "var(--bg-card)", color: (booked || blocked || arriving) ? "#fff" : "var(--ink)", display: "grid", placeItems: "center", fontSize: 12, border: arriving ? "2px solid #82391C" : "1px solid var(--line-soft)" }}>{dn}</div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 16, fontSize: 11, color: "var(--ink-mute)" }}>
          <RmLegend c="var(--accent)" t="Booked" />
          <RmLegend c="var(--warm)" t="Arriving" />
          <RmLegend c="var(--ink)" t="Blocked" />
          <RmLegend c="var(--bg-card)" t="Open" open />
        </div>
      </div>
    </div>
  );
}
