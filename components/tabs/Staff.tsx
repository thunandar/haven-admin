"use client";

import { useEffect, useState } from "react";
import { AdminHeader, Panel, usePaged, Pagination, ScrollX, Modal, ModalHead, MBField, mbInput, Avatar, Loading } from "../ui";
import { api, type Staff as StaffMember } from "../../lib/api";
import { AREAS, ROLE_PERMS } from "../../lib/perms";
import { toast } from "../../lib/toast";

export function Staff() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [adding, setAdding] = useState(false);
  const load = () => api.staff().then(setStaff).catch(() => {});
  useEffect(() => { load(); }, []);
  const pg = usePaged(staff || [], 10);
  const cols = "40px 1.3fr 0.9fr 1.5fr 0.9fr";
  if (!staff) return <Loading />;
  return (
    <div>
      <AdminHeader t="Staff & access" sub="Team and roles" action={
        <button className="btn btn-primary" onClick={() => setAdding(true)} style={{ padding: "9px 16px", fontSize: 13 }}>+ Add member</button>
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
      {adding && <AddMemberModal onClose={() => setAdding(false)} onSaved={load} />}
    </div>
  );
}

const DEFAULT_ROLE = "Front desk";

function AddMemberModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: "", email: "", role: DEFAULT_ROLE });
  const [perms, setPerms] = useState<string[]>(ROLE_PERMS[DEFAULT_ROLE]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  // Picking a role suggests its usual access; chips stay editable per person.
  const setRole = (role: string) => { setF((p) => ({ ...p, role })); setPerms(ROLE_PERMS[role] || []); };
  const toggle = (key: string) => setPerms((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  const submit = async () => {
    if (!f.name.trim() || !f.email.trim()) { setErr("Name and a valid email are required."); return; }
    if (!perms.length) { setErr("Pick at least one access area."); return; }
    setBusy(true); setErr("");
    try {
      await api.addStaff({ ...f, perms });
      onSaved();
      toast(`${f.name.trim()} added to the team.`);
      onClose();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Modal onClose={onClose} width={520}>
      <ModalHead t="Add a member" sub="Staff & access" onClose={onClose} />
      <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <MBField label="Full name" full><input style={mbInput} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Giulia Ferrara" /></MBField>
        <MBField label="Email" full><input type="email" style={mbInput} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@maisondesel.it" /></MBField>
        <MBField label="Role" full>
          <select style={mbInput} value={f.role} onChange={(e) => setRole(e.target.value)}>{Object.keys(ROLE_PERMS).map((o) => <option key={o}>{o}</option>)}</select>
        </MBField>
        <MBField label="Access" full>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AREAS.map((a) => {
              const on = perms.includes(a.key);
              return (
                <button key={a.key} type="button" onClick={() => toggle(a.key)} style={{
                  padding: "7px 13px", borderRadius: 999, fontSize: 12.5, cursor: "pointer",
                  border: `1px solid ${on ? "var(--accent-deep)" : "var(--line)"}`,
                  background: on ? "var(--accent-soft)" : "var(--bg-card)",
                  color: on ? "var(--accent-deep)" : "var(--ink-soft)",
                }}>{a.label}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 8 }}>They&apos;ll only see the portal sections selected above.</div>
        </MBField>
        {err && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--warm)" }}>{err}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 26px", borderTop: "1px solid var(--line-soft)" }}>
        <button className="btn btn-outline" onClick={onClose} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: "10px 22px", fontSize: 13, opacity: busy ? 0.6 : 1 }}>{busy ? "Adding…" : "Add member"}</button>
      </div>
    </Modal>
  );
}
