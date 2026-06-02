"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons";
import { AdminHeader, usePaged, Pagination, Loading } from "../ui";
import { api, type Review } from "../../lib/api";

type Status = "needs" | "drafted" | "replied";
const statusOf = (r: Review): Status => (r.reply ? "replied" : r.draft ? "drafted" : "needs");

export function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [busy, setBusy] = useState<string>("");
  // Per-review edits to Anya's draft. Keyed by review id; absent = use the server draft verbatim.
  const [edits, setEdits] = useState<Record<string, string>>({});
  // Post-send confirmation (whether the reply was emailed), keyed by review id.
  const [notice, setNotice] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"all" | Status>("all");
  const [rating, setRating] = useState<"all" | 5 | 4 | 3>("all");
  const [visibility, setVisibility] = useState<"all" | "site" | "hidden">("all");
  const load = () => api.reviews().then(setReviews).catch(() => {});
  useEffect(() => { load(); }, []);

  const all = reviews || [];
  // Apply rating + visibility first; status counts reflect that narrowed set so the chip numbers match what's shown.
  const ratingOk = (r: Review) => rating === "all" || (rating === 3 ? r.rating <= 3 : r.rating === rating);
  const visibilityOk = (r: Review) => visibility === "all" || (visibility === "site" ? r.featured : !r.featured);
  const base = all.filter((r) => ratingOk(r) && visibilityOk(r));
  const filtered = status === "all" ? base : base.filter((r) => statusOf(r) === status);
  const pg = usePaged(filtered, 10);

  const statusCount = (k: "all" | Status) => (k === "all" ? base.length : base.filter((r) => statusOf(r) === k).length);
  const draftCount = all.filter((r) => r.draft && !r.reply).length;
  const onSiteCount = all.filter((r) => r.featured).length;

  if (!reviews) return <Loading />;

  const reset = () => pg.setPage(1);
  const clearEdit = (id: string) => setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  // Regenerate discards any local edit so the fresh draft shows through.
  const draft = async (id: string) => { setBusy(id); await api.draftReply(id).catch(() => {}); clearEdit(id); await load(); setBusy(""); };
  const send = async (id: string, text: string) => {
    setBusy(id);
    const res = await api.sendReply(id, text.trim()).catch(() => null);
    if (res) setNotice((n) => ({ ...n, [id]: res.emailed ? `Reply published and emailed to ${res.sentTo}.` : "Reply published. No email on file for this guest." }));
    clearEdit(id);
    await load();
    setBusy("");
  };
  const toggleFeatured = async (r: Review) => { setBusy(r.id); await api.featureReview(r.id, !r.featured).catch(() => {}); await load(); setBusy(""); };

  const statusTabs: ["all" | Status, string][] = [["all", "All"], ["needs", "Needs response"], ["drafted", "Drafted"], ["replied", "Replied"]];
  const ratings: ["all" | 5 | 4 | 3, string][] = [["all", "All"], [5, "★ 5"], [4, "★ 4"], [3, "★ ≤3"]];
  const vis: ["all" | "site" | "hidden", string][] = [["all", "All"], ["site", "On site"], ["hidden", "Hidden"]];
  const seg = (active: boolean): React.CSSProperties => ({
    padding: "5px 11px", borderRadius: 7, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
    background: active ? "var(--bg-elev)" : "transparent",
    color: active ? "var(--ink)" : "var(--ink-mute)",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
  });
  const segWrap: React.CSSProperties = { display: "flex", gap: 4, padding: 3, background: "var(--bg-card)", borderRadius: 9, border: "1px solid var(--line-soft)" };

  return (
    <div>
      <AdminHeader t="Reviews" sub="Guest feedback · choose which show on your site" />
      <div style={{ marginBottom: 20, padding: 18, background: "var(--accent-soft)", borderRadius: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <Icons.Sparkle size={18} stroke={1.8} style={{ color: "var(--accent-deep)" }} />
        <div style={{ flex: 1, fontSize: 14, color: "var(--accent-deep)" }}>
          <strong>Anya has drafted {draftCount} response{draftCount === 1 ? "" : "s"}</strong> for your review. Approve or edit before they post.
          <span style={{ marginLeft: 6, opacity: 0.85 }}>· {onSiteCount} review{onSiteCount === 1 ? "" : "s"} shown on your site.</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {statusTabs.map(([k, l]) => (
          <button key={k} onClick={() => { setStatus(k); reset(); }} className={status === k ? "chip chip-dark" : "chip"}>{l} · {statusCount(k)}</button>
        ))}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <div style={segWrap}>
            {ratings.map(([k, l]) => (
              <button key={String(k)} onClick={() => { setRating(k); reset(); }} style={seg(rating === k)}>{l}</button>
            ))}
          </div>
          <div style={segWrap}>
            {vis.map(([k, l]) => (
              <button key={k} onClick={() => { setVisibility(k); reset(); }} title={k === "site" ? "Reviews shown on the public site" : k === "hidden" ? "Reviews not shown on the site" : "All reviews"} style={seg(visibility === k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {pg.slice.map((r) => (
        <div key={r.id} className="card-clean" style={{ background: "var(--bg-elev)", padding: 22, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{r.guest}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{r.roomName}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => toggleFeatured(r)}
                disabled={busy === r.id}
                title={r.featured ? "Shown on your public site — click to hide" : "Not shown on site — click to feature"}
                className="btn-ghost"
                style={{
                  display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "5px 10px", borderRadius: 7,
                  border: `1px solid ${r.featured ? "var(--accent)" : "var(--line)"}`,
                  background: r.featured ? "var(--accent-soft)" : "transparent",
                  color: r.featured ? "var(--accent-deep)" : "var(--ink-mute)", cursor: "pointer",
                }}
              >
                {r.featured ? <Icons.Check size={12} stroke={2} /> : <Icons.Globe size={12} stroke={1.8} />}
                {busy === r.id ? "…" : r.featured ? "On site" : "Show on site"}
              </button>
              <div style={{ display: "flex", gap: 2, color: "var(--warm)" }}>{Array.from({ length: r.rating }).map((_, k) => <Icons.Star key={k} size={12} />)}</div>
            </div>
          </div>
          <p className="serif italic" style={{ fontSize: 17, lineHeight: 1.5, marginBottom: 16 }}>&ldquo;{r.text}&rdquo;</p>
          {r.reply ? (
            <div style={{ padding: 14, background: "var(--bg-card)", borderRadius: 10, borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 6 }}>Your published reply</div>
              <p style={{ fontSize: 13, lineHeight: 1.55 }}>{r.reply}</p>
              {notice[r.id] && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 11, color: "var(--accent-deep)" }}><Icons.Check size={11} stroke={2} /> {notice[r.id]}</div>}
            </div>
          ) : r.draft ? (
            <div style={{ padding: 14, background: "var(--bg-card)", borderRadius: 10, borderLeft: "3px solid var(--accent)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, fontSize: 11, color: "var(--ink-mute)", marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.Sparkle size={11} stroke={1.8} /> Anya&rsquo;s draft response</span>
                {(edits[r.id] ?? r.draft) !== r.draft && <span style={{ color: "var(--accent-deep)" }}>Edited</span>}
              </div>
              <textarea
                value={edits[r.id] ?? r.draft}
                onChange={(e) => setEdits((p) => ({ ...p, [r.id]: e.target.value }))}
                disabled={busy === r.id}
                rows={3}
                style={{
                  width: "100%", resize: "vertical", fontSize: 13, lineHeight: 1.55, fontFamily: "inherit",
                  padding: "9px 11px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg-elev)", color: "var(--ink)",
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
                <button className="btn btn-accent" onClick={() => send(r.id, edits[r.id] ?? r.draft)} disabled={busy === r.id || !(edits[r.id] ?? r.draft).trim()} style={{ padding: "6px 14px", fontSize: 12 }}>{busy === r.id ? "…" : "Send"}</button>
                <button className="btn-ghost" onClick={() => draft(r.id)} disabled={busy === r.id} style={{ fontSize: 12, padding: "6px 10px" }}>{busy === r.id ? "Regenerating…" : "Regenerate"}</button>
                {(edits[r.id] ?? r.draft) !== r.draft && <button className="btn-ghost" onClick={() => clearEdit(r.id)} disabled={busy === r.id} style={{ fontSize: 12, padding: "6px 10px", color: "var(--ink-mute)" }}>Revert</button>}
              </div>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={() => draft(r.id)} disabled={busy === r.id} style={{ padding: "8px 14px", fontSize: 12 }}><Icons.Sparkle size={12} stroke={1.8} /> {busy === r.id ? "Drafting…" : "Draft a response"}</button>
          )}
        </div>
      ))}
      {pg.slice.length === 0 && <div className="mute" style={{ padding: 28, textAlign: "center", fontSize: 13 }}>No reviews in this view.</div>}
      <Pagination pg={pg} noun="reviews" />
    </div>
  );
}
