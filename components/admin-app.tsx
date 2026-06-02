"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "./icons";
import Login from "./login";
import { BookingModal, AddRoomModal, RoomDetailModal } from "./modals";
import {
  Overview, Bookings, RoomsInv, Pricing, GuestsTab, ReviewsTab, Staff, Promos, NewPromoModal, Reports, Settings,
} from "./tabs";
import { api, clearToken, getToken, type AuthUser, type Room } from "../lib/api";
import { Toaster } from "../lib/toast";
import { useIsMobile } from "../lib/use-responsive";

type ModalState = { type: "booking" } | { type: "addRoom" } | { type: "room"; room: Room } | { type: "promo" } | null;

const NAV: [string, string, keyof typeof Icons][] = [
  ["overview", "Overview", "Grid"],
  ["bookings", "Bookings", "Calendar"],
  ["rooms", "Rooms & inventory", "Bed"],
  ["pricing", "Pricing", "Sliders"],
  ["guests", "Guests", "Users"],
  ["reviews", "Reviews", "Quote"],
  ["promos", "Promotions", "Sparkle"],
  ["reports", "Reports", "List"],
  ["staff", "Staff & access", "Shield"],
  ["settings", "Settings", "Cog"],
];

const TAB_KEYS = new Set(NAV.map(([k]) => k));
const tabFromPath = (pathname: string) => {
  const seg = pathname.replace(/^\/+/, "").split("/")[0];
  return seg && TAB_KEYS.has(seg) ? seg : "overview";
};
const pathForTab = (t: string) => (t === "overview" ? "/" : `/${t}`);

function SidebarBody({ user, tab, setTab, onSignOut }: { user: AuthUser; tab: string; setTab: (t: string) => void; onSignOut: () => void }) {
  return (
    <>
      <div style={{ padding: "0 24px", marginBottom: 32 }}>
        <div className="eyebrow" style={{ color: "#8A8474" }}>Hotelier portal</div>
        <div className="serif" style={{ fontSize: 22, marginTop: 4 }}>Maison de Sel</div>
        <div style={{ fontSize: 11, color: "#8A8474" }}>Praiano, Italy</div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.map(([k, l, ic]) => {
          const I = Icons[ic];
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 24px", fontSize: 13, textAlign: "left",
              color: on ? "var(--bg)" : "#8A8474",
              background: on ? "rgba(244,238,227,0.06)" : "transparent",
              borderLeft: on ? "2px solid var(--bg)" : "2px solid transparent",
            }}><I size={15} stroke={1.6} /> {l}</button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: "20px 24px 0", borderTop: "1px solid #2A2722", display: "flex", flexDirection: "column", gap: 14 }}>
        <a href={process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#A6A099" }}>
          <Icons.Globe size={14} stroke={1.6} /> View booking site
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(244,238,227,0.12)", display: "grid", placeItems: "center", fontSize: 11, color: "#EDE9DD" }}>
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, color: "#EDE9DD" }}>{user.name}</div>
            <div style={{ fontSize: 10, color: "#8A8474" }}>{user.role}</div>
          </div>
        </div>
        <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#A6A099" }}>
          <Icons.ArrowLeft size={14} stroke={1.6} /> Sign out
        </button>
      </div>
    </>
  );
}

export default function AdminApp() {
  const router = useRouter();
  const pathname = usePathname();
  const tab = tabFromPath(pathname);
  const setTab = (t: string) => router.push(pathForTab(t));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [reload, setReload] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [navOpen, setNavOpen] = useState(false);
  const mobile = useIsMobile(900);

  useEffect(() => {
    if (getToken()) api.me().then(setUser).catch(() => clearToken()).finally(() => setReady(true));
    else setReady(true);
  }, []);

  useEffect(() => { if (user) api.rooms().then(setRooms).catch(() => {}); }, [user, reload]);

  const signOut = () => { clearToken(); setUser(null); };
  const openModal = (t: string) => setModal({ type: t } as ModalState);
  const bump = () => setReload((n) => n + 1);
  const navigate = (t: string) => { setTab(t); setNavOpen(false); };

  if (!ready) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--ink-mute)" }}>Loading…</div>;
  if (!user) return <Login onLogin={(u) => { setUser(u); setReady(true); }} />;

  const Content = (
    <>
      {tab === "overview" && <Overview openModal={openModal} reload={reload} />}
      {tab === "bookings" && <Bookings openModal={openModal} reload={reload} />}
      {tab === "rooms" && <RoomsInv openModal={openModal} openRoom={(r) => setModal({ type: "room", room: r })} reload={reload} />}
      {tab === "pricing" && <Pricing />}
      {tab === "guests" && <GuestsTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "promos" && <Promos openNew={() => openModal("promo")} reload={reload} />}
      {tab === "reports" && <Reports />}
      {tab === "staff" && <Staff />}
      {tab === "settings" && <Settings />}
    </>
  );

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh" }}>
      {mobile ? (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* mobile top bar */}
          <header style={{ position: "sticky", top: 0, zIndex: 60, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--ink)", color: "var(--bg)" }}>
            <button onClick={() => setNavOpen(true)} aria-label="Menu" style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", color: "var(--bg)", border: "1px solid rgba(244,238,227,0.2)" }}><Icons.Menu size={18} /></button>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 18, lineHeight: 1 }}>Maison de Sel</div>
              <div style={{ fontSize: 10, color: "#8A8474" }}>Hotelier portal</div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(244,238,227,0.12)", display: "grid", placeItems: "center", fontSize: 11 }}>
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
          </header>

          {/* drawer */}
          {navOpen && (
            <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(15,23,19,0.5)" }}>
              <aside onClick={(e) => e.stopPropagation()} className="fade-in" style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 256, maxWidth: "82vw", background: "var(--ink)", color: "var(--bg)", padding: "24px 0", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
                <button onClick={() => setNavOpen(false)} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, color: "#A6A099" }}><Icons.Close size={18} /></button>
                <SidebarBody user={user} tab={tab} setTab={navigate} onSignOut={signOut} />
              </aside>
            </div>
          )}

          <main style={{ flex: 1, padding: "20px 16px" }}>{Content}</main>
        </div>
      ) : (
        <div style={{ minHeight: "100vh" }}>
          <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 240, zIndex: 40, background: "var(--ink)", color: "var(--bg)", padding: "32px 0", display: "flex", flexDirection: "column" }}>
            <SidebarBody user={user} tab={tab} setTab={setTab} onSignOut={signOut} />
          </aside>
          <main style={{ marginLeft: 240, padding: "32px 40px", minWidth: 0 }}>{Content}</main>
        </div>
      )}

      {modal?.type === "booking" && <BookingModal rooms={rooms} onClose={() => setModal(null)} onSaved={bump} />}
      {modal?.type === "addRoom" && <AddRoomModal onClose={() => setModal(null)} onSaved={bump} />}
      {modal?.type === "room" && <RoomDetailModal room={modal.room} onClose={() => setModal(null)} onSaved={bump} />}
      {modal?.type === "promo" && <NewPromoModal onClose={() => setModal(null)} onSaved={bump} />}
      <Toaster />
    </div>
  );
}
