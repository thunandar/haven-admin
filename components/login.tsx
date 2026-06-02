"use client";

import { useState, type CSSProperties } from "react";
import { Logo } from "./icons";
import { api, setToken, type AuthUser } from "../lib/api";
import { useIsMobile } from "../lib/use-responsive";

const lgInput: CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-card)", fontSize: 15, color: "var(--ink)" };

export default function Login({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [email, setEmail] = useState("thunandarayemin228@gmail.com");
  const [pw, setPw] = useState("haven1234");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const mobile = useIsMobile(820);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { token, user } = await api.login(email, pw);
      setToken(token);
      onLogin(user);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.05fr 1fr" }}>
      <div style={{ position: "relative", background: "var(--accent-deep)", color: "#F2F5EE", padding: mobile ? "32px 24px" : "48px 56px", display: mobile ? "none" : "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <div className="photo" style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&q=80)", opacity: 0.32, borderRadius: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,51,37,0.55), rgba(15,51,37,0.85))" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={28} />
          <span className="serif" style={{ fontSize: 26 }}>haven</span>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div className="eyebrow" style={{ color: "rgba(242,245,238,0.7)", marginBottom: 16 }}>Hotelier portal</div>
          <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 440, marginBottom: 18 }}>Run your property the way you run a good evening.</h1>
          <p style={{ fontSize: 15, color: "rgba(242,245,238,0.82)", maxWidth: 400, lineHeight: 1.6 }}>Bookings, rooms, pricing and guest care — with Anya watching the numbers so you can watch the door.</p>
        </div>
        <div style={{ position: "relative", fontSize: 12, color: "rgba(242,245,238,0.6)" }}>Maison de Sel · Praiano, Amalfi Coast</div>
      </div>

      <div style={{ display: "grid", placeItems: "center", padding: 32, background: "var(--bg-warm)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, color: "var(--accent-deep)" }}>
              <Logo size={26} />
              <span className="serif" style={{ fontSize: 22 }}>Maison de Sel</span>
            </div>
          )}
          <h2 className="serif" style={{ fontSize: 32, marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 30 }}>Welcome back. Use your hotelier credentials.</p>
          <form onSubmit={submit}>
            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 7, fontWeight: 500 }}>Email</span>
              <input type="email" style={lgInput} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 7, fontWeight: 500 }}>Password</span>
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} style={lgInput} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--ink-mute)" }}>{show ? "Hide" : "Show"}</button>
              </div>
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink-soft)" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)" }} /> Remember me
              </label>
              <a href="#" style={{ color: "var(--accent)" }} onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>
            {err && <div style={{ fontSize: 13, color: "var(--warm)", marginBottom: 14 }}>{err}</div>}
            <button type="submit" className="btn btn-accent" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: 15, opacity: busy ? 0.6 : 1 }}>{busy ? "Signing in…" : "Sign in to portal"}</button>
          </form>
          <div style={{ marginTop: 22, fontSize: 12, color: "var(--ink-mute)", textAlign: "center", lineHeight: 1.6 }}>
            Demo — any password works for a hotelier email.<br />Try <span className="kbd">thunandarayemin228@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
