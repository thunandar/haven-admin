import type { CSSProperties, ReactNode } from "react";

interface IconProps {
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}

const Icon = ({ children, size = 18, stroke = 1.6, className = "", style = {} }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

export const Icons = {
  Search: (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>,
  Sparkle: (p: IconProps) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></Icon>,
  Star: (p: IconProps) => <Icon {...p} stroke={0}><path fill="currentColor" d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17l-6.1 3.4 1.4-6.8L2.2 9l6.9-.7z" /></Icon>,
  Heart: (p: IconProps) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></Icon>,
  MapPin: (p: IconProps) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Icon>,
  Calendar: (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></Icon>,
  Users: (p: IconProps) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>,
  Arrow: (p: IconProps) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>,
  ArrowLeft: (p: IconProps) => <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>,
  Close: (p: IconProps) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>,
  Menu: (p: IconProps) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Icon>,
  Plus: (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Trash: (p: IconProps) => <Icon {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></Icon>,
  Minus: (p: IconProps) => <Icon {...p}><path d="M5 12h14" /></Icon>,
  Filter: (p: IconProps) => <Icon {...p}><path d="M3 6h18M6 12h12M10 18h4" /></Icon>,
  Grid: (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>,
  List: (p: IconProps) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Icon>,
  Wifi: (p: IconProps) => <Icon {...p}><path d="M5 12.55a11 11 0 0 1 14 0M2 8.82a16 16 0 0 1 20 0M8.5 16.43a6 6 0 0 1 7 0M12 20h.01" /></Icon>,
  Coffee: (p: IconProps) => <Icon {...p}><path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" /><path d="M6 1v3M10 1v3M14 1v3" /></Icon>,
  Bed: (p: IconProps) => <Icon {...p}><path d="M2 12h20v8H2zM4 12V8h12v4M8 8V6h4v2" /></Icon>,
  Send: (p: IconProps) => <Icon {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></Icon>,
  Check: (p: IconProps) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>,
  Lock: (p: IconProps) => <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>,
  Shield: (p: IconProps) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>,
  Quote: (p: IconProps) => <Icon {...p}><path d="M3 21V10a4 4 0 0 1 4-4h1M14 21V10a4 4 0 0 1 4-4h1" /></Icon>,
  Sun: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Icon>,
  Moon: (p: IconProps) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Icon>,
  ChevronDown: (p: IconProps) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>,
  ChevronRight: (p: IconProps) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>,
  ChevronLeft: (p: IconProps) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>,
  Globe: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></Icon>,
  Sliders: (p: IconProps) => <Icon {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></Icon>,
  Cog: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon>,
};

export const Logo = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M6 26V8l10-4 10 4v18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M11 26V16h10v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M16 4v8" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const Stars = ({ n = 5, size = 13 }: { n?: number; size?: number }) => (
  <span style={{ display: "inline-flex", gap: 2, color: "var(--warm)" }}>
    {Array.from({ length: n }).map((_, i) => (
      <Icons.Star key={i} size={size} />
    ))}
  </span>
);
