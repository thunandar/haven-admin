"use client";

import { useEffect, useState } from "react";

// Returns true when the viewport is at/below `bp`. SSR + first client render
// both return false (desktop), so there's no hydration mismatch.
export function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return m;
}
