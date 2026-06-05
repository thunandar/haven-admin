"use client";

import { useEffect, useRef, useState } from "react";
import { Icons } from "./icons";
import { Modal, ModalHead, MBField, mbInput, StatusPill } from "./ui";
import { api, money, uploadImages, type Room, type Booking } from "../lib/api";
import { useIsMobile } from "../lib/use-responsive";
import { toast } from "../lib/toast";

// A booking is "guaranteed" when a card is on file (guest-site bookings embed
// "Visa •••• 4242" in the payment string) or money has already been taken.
// Manual "Pay at property" / "Payment link sent" bookings have neither, so the
// hotel carries the no-show risk until the guest pays or completes the link.
// Card numbers are never typed into this portal — staff record the payment
// state and the guest enters their own card via the site or a payment link.
const isUnguaranteed = (payment: string) => payment === "Pay at property" || payment === "Payment link sent";

const UNGUARANTEED_HINTS: Record<string, string> = {
  "Pay at property": "No card on file — nothing backs this booking if the guest no-shows or cancels late. Take a deposit or send a payment link for cover.",
  "Payment link sent": "The guest enters their card themselves via the secure link. The booking stays unguaranteed until they complete it.",
};

// ---------------- NEW / MANUAL BOOKING ----------------
export function BookingModal({ rooms, onClose, onSaved }: { rooms: Room[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: "", email: "", phone: "", roomId: rooms[0]?.id || "",
    checkin: "2026-05-24", checkout: "2026-05-27", adults: 2, children: 0,
    source: "Front desk", payment: "Deposit paid", notes: "",
  });
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const g2 = useIsMobile(640) ? "1fr" : "1fr 1fr";
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const room = rooms.find((r) => r.id === f.roomId);
  const nights = Math.max(0, Math.round((+new Date(f.checkout) - +new Date(f.checkin)) / 86400000));
  const total = nights * (room?.price || 0);

  const submit = async () => {
    if (!f.name.trim() || nights < 1) { setErr("Please add a guest name and a valid date range."); return; }
    setBusy(true); setErr("");
    try {
      const b = await api.createBooking({ ...f, guest: f.name }); // API field is `guest`
      setDone(b.ref);
      onSaved();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <Modal onClose={onClose} width={460}>
        <div style={{ padding: "44px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent-deep)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}><Icons.Check size={26} stroke={2} /></div>
          <h2 className="serif" style={{ fontSize: 26, marginBottom: 8 }}>Booking created</h2>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 4 }}>{f.name} · {room?.name}</p>
          <p style={{ fontSize: 13, color: "var(--ink-mute)" }}>{nights} nights · {total ? money(total) : "—"}</p>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, marginTop: 16, padding: "8px 14px", background: "var(--bg-card)", borderRadius: 8, display: "inline-block" }}>{done}</div>
          <div style={{ marginTop: 24 }}>
            <button className="btn btn-primary" onClick={onClose} style={{ padding: "11px 26px" }}>Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} width={620}>
      <ModalHead t="Manual booking" sub="Create a reservation" onClose={onClose} />
      <div style={{ padding: "22px 26px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Guest</div>
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 14, marginBottom: 22 }}>
          <MBField label="Full name" full><input style={{ ...mbInput, borderColor: err && !f.name.trim() ? "var(--warm)" : "var(--line)" }} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Maya Okafor" /></MBField>
          <MBField label="Email"><input type="email" style={mbInput} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="guest@email.com" /></MBField>
          <MBField label="Phone"><input style={mbInput} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+39 ..." /></MBField>
        </div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Stay</div>
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 14, marginBottom: 22 }}>
          <MBField label="Room" full>
            <select style={mbInput} value={f.roomId} onChange={(e) => set("roomId", e.target.value)}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — ${r.price}/night</option>)}
            </select>
          </MBField>
          <MBField label="Check in"><input type="date" style={mbInput} value={f.checkin} onChange={(e) => set("checkin", e.target.value)} /></MBField>
          <MBField label="Check out"><input type="date" style={{ ...mbInput, borderColor: err && nights < 1 ? "var(--warm)" : "var(--line)" }} value={f.checkout} onChange={(e) => set("checkout", e.target.value)} /></MBField>
          <MBField label="Adults"><input type="number" min="1" style={mbInput} value={f.adults} onChange={(e) => set("adults", Number(e.target.value))} /></MBField>
          <MBField label="Children"><input type="number" min="0" style={mbInput} value={f.children} onChange={(e) => set("children", Number(e.target.value))} /></MBField>
        </div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Booking details</div>
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 14 }}>
          <MBField label="Source">
            <select style={mbInput} value={f.source} onChange={(e) => set("source", e.target.value)}>
              {["Front desk", "Phone", "Walk-in", "Email", "Anya chatbot", "OTA / Partner"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </MBField>
          <MBField label="Payment">
            <select style={mbInput} value={f.payment} onChange={(e) => set("payment", e.target.value)}>
              {["Paid in full", "Deposit paid", "Pay at property", "Payment link sent"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </MBField>
          {isUnguaranteed(f.payment) && (
            <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--warm)", lineHeight: 1.5, marginTop: -4 }}>
              {UNGUARANTEED_HINTS[f.payment]}
            </div>
          )}
          <MBField label="Notes / special requests" full>
            <textarea rows={2} style={{ ...mbInput, resize: "vertical" }} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Late arrival, dietary needs, occasion…" />
          </MBField>
        </div>
        {err && <div style={{ fontSize: 12, color: "var(--warm)", marginTop: 12 }}>{err}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 26px", borderTop: "1px solid var(--line-soft)", position: "sticky", bottom: 0, background: "var(--bg-elev)" }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {nights > 0 ? <span><strong className="serif" style={{ fontSize: 20 }}>{money(total)}</strong> · {nights} night{nights > 1 ? "s" : ""}</span> : "Select valid dates"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: "10px 22px", fontSize: 13, opacity: busy ? 0.6 : 1 }}>{busy ? "Creating…" : "Create booking"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------- ADD ROOM ----------------
export function AddRoomModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: "", bed: "King", sleeps: 2, price: "", desc: "" });
  const [amen, setAmen] = useState<string[]>(["Sea view"]);
  const [amenInput, setAmenInput] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const g2 = useIsMobile(640) ? "1fr" : "1fr 1fr";
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const addAmen = () => { if (amenInput.trim()) { setAmen([...amen, amenInput.trim()]); setAmenInput(""); } };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = ""; // allow re-picking the same file
    if (!files.length) return;
    setPhotoErr("");
    setUploading(true);
    try {
      const urls = await uploadImages(files);
      setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      setPhotoErr((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.addRoom({ name: f.name, bed: f.bed, sleeps: Number(f.sleeps), price: Number(f.price) || 0, desc: f.desc, amenities: amen, gallery: photos });
      onSaved();
      onClose();
    } catch { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} width={640}>
      <ModalHead t="Add a room" sub="New inventory" onClose={onClose} />
      <div style={{ padding: "22px 26px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Photos</div>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onChange={onPickFiles} style={{ display: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 10, marginBottom: photoErr ? 8 : 24 }}>
          {photos.map((p, i) => (
            <div key={p} style={{ position: "relative" }}>
              <div className="photo" style={{ height: 78, backgroundImage: `url(${p})`, borderRadius: 10 }} />
              {i === 0 && <span style={{ position: "absolute", left: 6, bottom: 6, fontSize: 10, background: "var(--ink)", color: "var(--bg)", padding: "2px 7px", borderRadius: 999 }}>Cover</span>}
              <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} style={{ position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: "50%", background: "rgba(15,23,19,0.6)", color: "#fff", display: "grid", placeItems: "center" }}><Icons.Close size={11} /></button>
            </div>
          ))}
          <button onClick={() => fileInput.current?.click()} disabled={uploading} style={{ height: 78, borderRadius: 10, border: "1.5px dashed var(--line)", color: "var(--ink-mute)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, background: "var(--bg-card)" }}>
            {uploading ? <Icons.Sparkle size={16} /> : <Icons.Plus size={16} />} {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {photoErr && <div style={{ fontSize: 12, color: "var(--warm)", marginBottom: 16 }}>{photoErr}</div>}
        {photos.length === 0 && !photoErr && <div className="mute" style={{ fontSize: 12, marginBottom: 16 }}>Upload at least one photo — JPG, PNG, WebP, GIF or AVIF, up to 8MB each. The first becomes the cover.</div>}
        <div style={{ display: "grid", gridTemplateColumns: g2, gap: 14, marginBottom: 22 }}>
          <MBField label="Room name" full><input style={mbInput} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Suite Mareluna" /></MBField>
          <MBField label="Bed">
            <select style={mbInput} value={f.bed} onChange={(e) => set("bed", e.target.value)}>{["King", "Queen", "Twin", "Futon", "King + Twin"].map((o) => <option key={o}>{o}</option>)}</select>
          </MBField>
          <MBField label="Sleeps"><input type="number" min="1" style={mbInput} value={f.sleeps} onChange={(e) => set("sleeps", Number(e.target.value))} /></MBField>
          <MBField label="Base rate / night" full>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)" }}>$</span>
              <input type="number" style={{ ...mbInput, paddingLeft: 24 }} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="320" />
            </div>
          </MBField>
          <MBField label="Description" full>
            <textarea rows={2} style={{ ...mbInput, resize: "vertical" }} value={f.desc} onChange={(e) => set("desc", e.target.value)} placeholder="A short, evocative description of the room…" />
          </MBField>
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Amenities</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {amen.map((a, i) => (
            <span key={i} className="chip" style={{ paddingRight: 6 }}>{a}
              <button onClick={() => setAmen(amen.filter((_, j) => j !== i))} style={{ display: "grid", placeItems: "center", color: "var(--ink-mute)" }}><Icons.Close size={11} /></button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...mbInput, flex: 1 }} value={amenInput} onChange={(e) => setAmenInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAmen()} placeholder="Add an amenity and press Enter" />
          <button className="btn btn-outline" onClick={addAmen} style={{ padding: "10px 16px", fontSize: 13 }}>Add</button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 26px", borderTop: "1px solid var(--line-soft)", position: "sticky", bottom: 0, background: "var(--bg-elev)" }}>
        <button className="btn btn-outline" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={!f.name.trim() || photos.length === 0 || busy || uploading} style={{ padding: "10px 22px", fontSize: 13, opacity: f.name.trim() && photos.length > 0 && !busy && !uploading ? 1 : 0.5 }}>{busy ? "Adding…" : "Add room"}</button>
      </div>
    </Modal>
  );
}

// ---------------- ROOM DETAIL (view · edit · delete) ----------------
const BED_OPTS = ["King", "Queen", "Twin", "Futon", "King + Twin", "King + Sofa", "Queen + Sofa"];

export function RoomDetailModal({ room, onClose, onSaved }: { room: Room; onClose: () => void; onSaved: () => void }) {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [f, setF] = useState({ name: room.name, bed: room.bed, sleeps: room.sleeps, price: String(room.price), desc: room.desc });
  const [amen, setAmen] = useState<string[]>(room.amenities);
  const [amenInput, setAmenInput] = useState("");
  const [photos, setPhotos] = useState<string[]>(room.gallery);
  const [uploading, setUploading] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const g2 = useIsMobile(640) ? "1fr" : "1fr 1fr";
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const addAmen = () => { if (amenInput.trim()) { setAmen([...amen, amenInput.trim()]); setAmenInput(""); } };
  const bedOpts = BED_OPTS.includes(f.bed) ? BED_OPTS : [f.bed, ...BED_OPTS];

  // Gallery shown up top: live edits in edit mode, saved photos in view mode.
  const shots = mode === "edit" ? photos : room.gallery;
  const idx = shots.length ? Math.min(active, shots.length - 1) : 0;
  const step = (dir: number) => setActive((a) => (a + dir + shots.length) % shots.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shots.length < 2) return;
      // Don't hijack arrow keys while typing in the edit form.
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shots.length]);

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = "";
    if (!files.length) return;
    setPhotoErr("");
    setUploading(true);
    try {
      const urls = await uploadImages(files);
      setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      setPhotoErr((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (photos.length === 0) { setErr("Keep at least one photo."); return; }
    setBusy(true); setErr("");
    try {
      await api.updateRoom(room.id, { name: f.name, bed: f.bed, sleeps: Number(f.sleeps), price: Number(f.price) || 0, desc: f.desc, amenities: amen, gallery: photos });
      toast(`${f.name} updated`);
      onSaved(); onClose();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  const del = async () => {
    setBusy(true); setErr("");
    try {
      await api.deleteRoom(room.id);
      toast(`${room.name} deleted`);
      onSaved(); onClose();
    } catch (e) { setErr((e as Error).message); setBusy(false); setConfirmDel(false); }
  };

  return (
    <Modal onClose={onClose} width={780}>
      <div style={{ position: "relative" }}>
        <div className="photo" style={{ height: 360, backgroundImage: shots.length ? `url(${shots[idx]})` : undefined, borderRadius: "18px 18px 0 0" }} />
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(15,23,19,0.55)", color: "#fff", display: "grid", placeItems: "center" }}><Icons.Close size={17} /></button>
        {shots.length > 1 && (
          <>
            <button onClick={() => step(-1)} aria-label="Previous photo" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(15,23,19,0.5)", color: "#fff", display: "grid", placeItems: "center" }}><Icons.ChevronLeft size={20} /></button>
            <button onClick={() => step(1)} aria-label="Next photo" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(15,23,19,0.5)", color: "#fff", display: "grid", placeItems: "center" }}><Icons.ChevronRight size={20} /></button>
          </>
        )}
        <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", gap: 8 }}>
          {shots.map((g, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: 54, height: 40, borderRadius: 7, backgroundImage: `url(${g})`, backgroundSize: "cover", backgroundPosition: "center", border: i === idx ? "2px solid #fff" : "2px solid rgba(255,255,255,0.4)", opacity: i === idx ? 1 : 0.8 }} />
          ))}
        </div>
        {shots.length > 0 && <span style={{ position: "absolute", right: 16, bottom: 16, fontSize: 11, color: "#fff", background: "rgba(15,23,19,0.55)", padding: "4px 10px", borderRadius: 999 }}>{idx + 1} / {shots.length}</span>}
      </div>
      <div style={{ padding: "24px 28px" }}>
        {mode === "view" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 30 }}>{room.name}</h2>
                <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>{room.bed} bed · sleeps {room.sleeps} · {room.bookedThisWeek} nights booked in May</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="serif" style={{ fontSize: 26 }}>${room.price}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>per night</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 18 }}>{room.desc}</p>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Amenities</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {room.amenities.map((a) => <span key={a} className="chip">{a}</span>)}
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Photos</div>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onChange={onPickFiles} style={{ display: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 10, marginBottom: photoErr ? 8 : 22 }}>
              {photos.map((p, i) => (
                <div key={p} style={{ position: "relative" }}>
                  <div className="photo" style={{ height: 78, backgroundImage: `url(${p})`, borderRadius: 10 }} />
                  {i === 0 && <span style={{ position: "absolute", left: 6, bottom: 6, fontSize: 10, background: "var(--ink)", color: "var(--bg)", padding: "2px 7px", borderRadius: 999 }}>Cover</span>}
                  <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} style={{ position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: "50%", background: "rgba(15,23,19,0.6)", color: "#fff", display: "grid", placeItems: "center" }}><Icons.Close size={11} /></button>
                </div>
              ))}
              <button onClick={() => fileInput.current?.click()} disabled={uploading} style={{ height: 78, borderRadius: 10, border: "1.5px dashed var(--line)", color: "var(--ink-mute)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, background: "var(--bg-card)" }}>
                {uploading ? <Icons.Sparkle size={16} /> : <Icons.Plus size={16} />} {uploading ? "Uploading…" : "Add"}
              </button>
            </div>
            {photoErr && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 16 }}>{photoErr}</div>}
            <div style={{ display: "grid", gridTemplateColumns: g2, gap: 14, marginBottom: 20 }}>
              <MBField label="Room name" full><input style={mbInput} value={f.name} onChange={(e) => set("name", e.target.value)} /></MBField>
              <MBField label="Bed">
                <select style={mbInput} value={f.bed} onChange={(e) => set("bed", e.target.value)}>{bedOpts.map((o) => <option key={o}>{o}</option>)}</select>
              </MBField>
              <MBField label="Sleeps"><input type="number" min="1" style={mbInput} value={f.sleeps} onChange={(e) => set("sleeps", Number(e.target.value))} /></MBField>
              <MBField label="Base rate / night" full>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)" }}>$</span>
                  <input type="number" style={{ ...mbInput, paddingLeft: 24 }} value={f.price} onChange={(e) => set("price", e.target.value)} />
                </div>
              </MBField>
              <MBField label="Description" full>
                <textarea rows={2} style={{ ...mbInput, resize: "vertical" }} value={f.desc} onChange={(e) => set("desc", e.target.value)} />
              </MBField>
            </div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Amenities</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {amen.map((a, i) => (
                <span key={i} className="chip" style={{ paddingRight: 6 }}>{a}
                  <button onClick={() => setAmen(amen.filter((_, j) => j !== i))} style={{ display: "grid", placeItems: "center", color: "var(--ink-mute)" }}><Icons.Close size={11} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...mbInput, flex: 1 }} value={amenInput} onChange={(e) => setAmenInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAmen()} placeholder="Add an amenity and press Enter" />
              <button className="btn btn-outline" onClick={addAmen} style={{ padding: "10px 16px", fontSize: 13 }}>Add</button>
            </div>
          </>
        )}
        {err && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 14 }}>{err}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 24 }}>
          {mode === "view" && !confirmDel && (
            <>
              <button className="btn" onClick={() => setConfirmDel(true)} style={{ padding: "10px 18px", fontSize: 13, color: "var(--danger)", border: "1px solid var(--danger)", background: "transparent", display: "inline-flex", alignItems: "center", gap: 7 }}><Icons.Trash size={15} /> Delete</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline" onClick={() => { setMode("edit"); setErr(""); }} style={{ padding: "10px 18px", fontSize: 13 }}>Edit</button>
                <button className="btn btn-primary" onClick={onClose} style={{ padding: "10px 22px", fontSize: 13 }}>Close</button>
              </div>
            </>
          )}
          {mode === "view" && confirmDel && (
            <>
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Delete <strong>{room.name}</strong> permanently?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline" onClick={() => setConfirmDel(false)} disabled={busy} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
                <button className="btn" onClick={del} disabled={busy} style={{ padding: "10px 22px", fontSize: 13, background: "var(--danger)", color: "#fff", opacity: busy ? 0.6 : 1 }}>{busy ? "Deleting…" : "Delete room"}</button>
              </div>
            </>
          )}
          {mode === "edit" && (
            <>
              <span />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline" onClick={() => { setMode("view"); setErr(""); }} disabled={busy} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={busy || !f.name.trim()} style={{ padding: "10px 22px", fontSize: 13, opacity: busy || !f.name.trim() ? 0.5 : 1 }}>{busy ? "Saving…" : "Save changes"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------------- BOOKING DETAIL (view · cancel) ----------------
const DField = ({ label, value, mono, full }: { label: string; value: React.ReactNode; mono?: boolean; full?: boolean }) => (
  <div style={{ gridColumn: full ? "1 / -1" : undefined, minWidth: 0 }}>
    <div style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, color: "var(--ink)", fontFamily: mono ? "var(--mono)" : undefined, wordBreak: "break-word" }}>{value === "" || value == null ? "—" : value}</div>
  </div>
);

export function BookingDetailModal({ booking, onClose, onChanged }: { booking: Booking; onClose: () => void; onChanged: () => void }) {
  const [b, setB] = useState(booking);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const active = b.status === "Confirmed" || b.status === "Arriving today" || b.status === "In-house";

  const cancel = async () => {
    setBusy(true);
    try {
      const updated = await api.cancelBooking(b.ref);
      setB(updated);
      toast(`${b.guest}'s booking cancelled`);
      onChanged();
      setConfirmCancel(false);
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  const guests = `${b.adults} adult${b.adults > 1 ? "s" : ""}${b.children ? ` · ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}`;

  // No-show risk only matters while the stay is still ahead — once the guest is
  // in-house, past, or cancelled, the guarantee question is moot.
  const upcoming = b.status === "Confirmed" || b.status === "Arriving today";
  const unguaranteed = upcoming && isUnguaranteed(b.payment);

  return (
    <Modal onClose={onClose} width={600}>
      <ModalHead t={b.guest} sub="Reservation" onClose={onClose} />
      <div style={{ padding: "20px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 14, padding: "6px 12px", background: "var(--bg-card)", borderRadius: 8 }}>{b.ref}</span>
          <StatusPill status={b.status} color={b.color} />
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Guest</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 }}>
          <DField label="Email" value={b.email} mono />
          <DField label="Phone" value={b.phone} />
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Stay</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 }}>
          <DField label="Room" value={b.room} />
          <DField label="Dates" value={b.stay} />
          <DField label="Nights" value={b.nights} />
          <DField label="Guests" value={guests} />
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Booking</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
          <DField label="Total" value={money(b.total)} />
          {b.discount > 0 && <DField label="Promo" value={`${b.promoCode} · −${money(b.discount)}`} />}
          <DField label="Payment" value={
            unguaranteed ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {b.payment}
                <span title={UNGUARANTEED_HINTS[b.payment]} style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10.5, background: "#F5E6DA", color: "#82391C", whiteSpace: "nowrap" }}>Unguaranteed</span>
              </span>
            ) : b.payment
          } />
          <DField label="Source" value={`${b.source || "Website"}${b.bookedBy ? ` · by ${b.bookedBy}` : ""}`} />
          {b.notes && <DField label="Notes" value={b.notes} full />}
        </div>
        {unguaranteed && (
          <div style={{ fontSize: 12, color: "var(--warm)", lineHeight: 1.5, marginTop: 14 }}>
            {UNGUARANTEED_HINTS[b.payment]}
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 26px", borderTop: "1px solid var(--line-soft)" }}>
        {active && !confirmCancel ? (
          <button className="btn" onClick={() => setConfirmCancel(true)} style={{ padding: "10px 18px", fontSize: 13, color: "var(--warm)", border: "1px solid var(--warm)", background: "transparent" }}>Cancel booking</button>
        ) : <span />}
        {confirmCancel ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Cancel this stay?</span>
            <button className="btn btn-outline" onClick={() => setConfirmCancel(false)} disabled={busy} style={{ padding: "10px 16px", fontSize: 13 }}>No</button>
            <button className="btn" onClick={cancel} disabled={busy} style={{ padding: "10px 18px", fontSize: 13, background: "var(--warm)", color: "#fff", opacity: busy ? 0.6 : 1 }}>{busy ? "Cancelling…" : "Yes, cancel"}</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onClose} style={{ padding: "10px 22px", fontSize: 13 }}>Close</button>
        )}
      </div>
    </Modal>
  );
}
