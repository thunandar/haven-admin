"use client";

import { useEffect, useState } from "react";
import { Icons } from "../components/icons";

type Kind = "success" | "error";
type Item = { id: number; msg: string; kind: Kind };

// Module-level store so toast() is callable from anywhere — no context plumbing.
let items: Item[] = [];
let subs: Array<() => void> = [];
let seq = 1;
const emit = () => subs.forEach((f) => f());

export function toast(msg: string, kind: Kind = "success") {
  const id = seq++;
  items = [...items, { id, msg, kind }];
  emit();
  setTimeout(() => { items = items.filter((t) => t.id !== id); emit(); }, 3400);
}

export function Toaster() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.push(f);
    return () => { subs = subs.filter((s) => s !== f); };
  }, []);

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {items.map((t) => {
        const ok = t.kind === "success";
        return (
          <div key={t.id} className="fade-in" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12,
            background: "var(--bg-elev)", border: "1px solid var(--line-soft)", boxShadow: "var(--shadow-lg)",
            minWidth: 240, maxWidth: 360, fontSize: 13.5, color: "var(--ink)", pointerEvents: "auto",
          }}>
            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background: ok ? "var(--accent)" : "var(--danger)" }}>
              {ok ? <Icons.Check size={13} stroke={2.2} /> : <Icons.Close size={13} stroke={2.2} />}
            </span>
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}
