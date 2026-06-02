"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Panel, usePaged, Pagination, ScrollX, Modal, ModalHead, MBField, mbInput, Avatar, Loading } from "../ui";
import { api, type Staff as StaffMember } from "../../lib/api";

export function Staff() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [invite, setInvite] = useState(false);
  const load = () => api.staff().then(setStaff).catch(() => {});
  useEffect(() => { load(); }, []);
  const pg = usePaged(staff || [], 10);
  const cols = "40px 1.3fr 0.9fr 1.5fr 0.9fr";
  if (!staff) return <Loading />;
  return (
    <div>
      <AdminHeader t="Staff & access" sub="Team and roles" action={
        <button className="btn btn-primary" onClick={() => setInvite(true)} style={{ padding: "9px 16px", fontSize: 13 }}>+ Invite member</button>
      } />
      <Panel title={`Team · ${staff.length}`}>
        <ScrollX min={620}>
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "0 0 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", borderBottom: "1px solid var(--line-soft)" }}>
          <div></div><div>Member</div><div>Role</div><div>Access</div><div>Last active</div>
        </div>
        {pg.slice.map((m) => (
          <div key={m.email} style={{ display: "grid", gridTemplateColumns: cols, gap: 14, padding: "13px 0", borderBottom: "1px solid var(--line-soft)", alignItems: "center", fontSize: 13 }}>
            <Avatar name={m.n} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>{m.n} {m.you && <span style={{ fontSize: 10, color: "var(--accent-deep)", background: "var(--accent-soft)", padding: "1px 7px", borderRadius: 999 }}>You</span>}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
            </div>
            <div><span className="chip">{m.role}</span></div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{m.perms}</div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{m.last}</div>
          </div>
        ))}
        </ScrollX>
        <Pagination pg={pg} noun="members" />
      </Panel>
      {invite && <InviteModal onClose={() => setInvite(false)} onSaved={load} />}
    </div>
  );
}

function InviteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: "", email: "", role: "Front desk", perms: "Bookings · Guests" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!f.name.trim() || !f.email.trim()) { setErr("Name and a valid email are required."); return; }
    setBusy(true); setErr("");
    try {
      const r = await api.invite(f);
      onSaved();
      setNote(r.emailed ? `Invite emailed to ${f.email}.` : `${f.name} added. (Email is in demo mode — no message sent.)`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  if (note) {
    return (
      <Modal onClose={onClose} width={420}>
        <div style={{ padding: "40px 30px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent-deep)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icons.Check size={24} stroke={2} /></div>
          <h2 className="serif" style={{ fontSize: 24, marginBottom: 8 }}>Invitation sent</h2>
          <p className="soft" style={{ fontSize: 13, marginBottom: 22 }}>{note}</p>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: "10px 24px" }}>Done</button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal onClose={onClose} width={520}>
      <ModalHead t="Invite a member" sub="Staff & access" onClose={onClose} />
      <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <MBField label="Full name" full><input style={mbInput} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Giulia Ferrara" /></MBField>
        <MBField label="Email" full><input type="email" style={mbInput} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@maisondesel.it" /></MBField>
        <MBField label="Role">
          <select style={mbInput} value={f.role} onChange={(e) => set("role", e.target.value)}>{["Front desk", "Manager", "Housekeeping", "Concierge", "Maintenance", "Night manager", "Kitchen"].map((o) => <option key={o}>{o}</option>)}</select>
        </MBField>
        <MBField label="Access"><input style={mbInput} value={f.perms} onChange={(e) => set("perms", e.target.value)} /></MBField>
        {err && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--warm)" }}>{err}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 26px", borderTop: "1px solid var(--line-soft)" }}>
        <button className="btn btn-outline" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: "10px 22px", fontSize: 13, opacity: busy ? 0.6 : 1 }}>{busy ? "Sending…" : "Send invite"}</button>
      </div>
    </Modal>
  );
}
