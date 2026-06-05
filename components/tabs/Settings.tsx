"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, Panel, Loading, mbInput, mbLabel } from "../ui";
import { api, type GoodToKnow } from "../../lib/api";
import { toast } from "../../lib/toast";

// Icons offered for "Good to know" facts. Every name here is drawn by both the
// admin and the guest site, so whatever the hotelier picks renders on the homepage.
const ICON_CHOICES: (keyof typeof Icons)[] = [
  "Coffee", "MapPin", "Heart", "Shield", "Wifi", "Star",
  "Sparkle", "Globe", "Sun", "Moon", "Bed", "Users",
  "Calendar", "Check", "Lock", "Quote",
];

export function Settings() {
  const [items, setItems] = useState<GoodToKnow[] | null>(null);
  const [payNowDiscount, setPayNowDiscount] = useState<string>("10");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.hotel().then((h) => {
      setItems(h.goodToKnow ?? []);
      setPayNowDiscount(String(h.payNowDiscount ?? 10));
    }).catch(() => setItems([]));
  }, []);

  if (!items) return <Loading />;

  const set = (i: number, patch: Partial<GoodToKnow>) =>
    setItems((prev) => (prev ? prev.map((it, j) => (j === i ? { ...it, ...patch } : it)) : prev));
  const remove = (i: number) => setItems((prev) => (prev ? prev.filter((_, j) => j !== i) : prev));
  const add = () =>
    setItems((prev) => (prev && prev.length >= 8 ? prev : [...(prev || []), { icon: "Sparkle", title: "", text: "" }]));

  const save = async () => {
    const cleaned = items.map((it) => ({ ...it, title: it.title.trim(), text: it.text.trim() }));
    if (cleaned.some((it) => !it.title)) { toast("Each item needs a title.", "error"); return; }
    const discount = Number(payNowDiscount);
    if (!Number.isInteger(discount) || discount < 0 || discount > 50) {
      toast("Pay-now discount must be a whole number between 0 and 50.", "error");
      return;
    }
    setBusy(true);
    try {
      const h = await api.updateHotel({ goodToKnow: cleaned, payNowDiscount: discount });
      setItems(h.goodToKnow ?? []);
      setPayNowDiscount(String(h.payNowDiscount ?? discount));
      toast("Settings saved — your booking site is updated.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminHeader t="Settings" sub="Site content" action={
        <button className="btn btn-primary" onClick={save} disabled={busy} style={{ padding: "9px 18px", fontSize: 13, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      } />
      <Panel title="Rates & payment">
        <p className="soft" style={{ fontSize: 13, marginTop: -6, marginBottom: 14 }}>
          Guests choose between paying at the property (free cancellation, card held as guarantee) and prepaying online at a discount (non-refundable, charged at booking).
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label style={{ display: "block" }}>
            <span style={mbLabel}>Pay-now discount (%)</span>
            <input
              type="number" min={0} max={50} step={1}
              style={{ ...mbInput, width: 120 }}
              value={payNowDiscount}
              onChange={(e) => setPayNowDiscount(e.target.value)}
            />
          </label>
          <span className="mute" style={{ fontSize: 12, maxWidth: 380, lineHeight: 1.5 }}>
            {Number(payNowDiscount) === 0
              ? "0% — the pay-now option is hidden; every booking pays at the property."
              : `A $400/night room shows ${"$" + Math.round(400 * (1 - (Number(payNowDiscount) || 0) / 100))}/night on the prepaid rate. Typical range is 10–15%.`}
          </span>
        </div>
      </Panel>

      <div style={{ height: 18 }} />

      <Panel title="“Good to know”" action={
        <button className="btn btn-outline" onClick={add} disabled={items.length >= 8} style={{ padding: "7px 14px", fontSize: 12, opacity: items.length >= 8 ? 0.5 : 1 }}>+ Add item</button>
      }>
        <p className="soft" style={{ fontSize: 13, marginTop: -6, marginBottom: 18 }}>
          The row of facts shown near the bottom of your booking site, under the rooms. Up to 8 items.
        </p>

        {items.length === 0 && (
          <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>
            No items yet. Add one to show it on your site.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((it, i) => {
            const Active = Icons[it.icon as keyof typeof Icons] || Icons.Sparkle;
            return (
              <div key={i} style={{ border: "1px solid var(--line-soft)", borderRadius: 14, padding: 16, background: "var(--bg-card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent)" }}>
                    <Active size={20} stroke={1.5} />
                    <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Item {i + 1}</span>
                  </div>
                  <button onClick={() => remove(i)} aria-label="Remove item" title="Remove" style={{ color: "var(--ink-mute)", display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)" }}>
                    <Icons.Trash size={15} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ display: "block" }}>
                    <span style={mbLabel}>Title</span>
                    <input style={mbInput} value={it.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="e.g. Breakfast included" />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={mbLabel}>Description</span>
                    <input style={mbInput} value={it.text} onChange={(e) => set(i, { text: e.target.value })} placeholder="A short line of detail." />
                  </label>
                </div>

                <div style={{ marginTop: 12 }}>
                  <span style={mbLabel}>Icon</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ICON_CHOICES.map((name) => {
                      const I = Icons[name];
                      const on = it.icon === name;
                      return (
                        <button key={name} onClick={() => set(i, { icon: name })} aria-label={name} aria-pressed={on} title={name} style={{
                          width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
                          border: on ? "1.5px solid var(--accent)" : "1px solid var(--line)",
                          background: on ? "var(--accent-soft)" : "var(--bg-elev)",
                          color: on ? "var(--accent-deep)" : "var(--ink-soft)",
                        }}><I size={17} stroke={1.6} /></button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
