export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "haven_admin_token";

export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export const getToken = () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ---- Types ----
export interface AuthUser { id: string; email: string; name: string; role: string; isOwner: boolean; perms: string[] }

export interface GoodToKnow { icon: string; title: string; text: string }
export interface Hotel {
  id: string; name: string; tagline: string; location: string; country: string;
  rating: number; reviews: number; hero: string; address: string; email: string; phone: string;
  amenities: string[]; goodToKnow: GoodToKnow[];
  payNowDiscount: number; // prepaid-rate % off; 0 disables pay now on the guest site
}

export interface Room {
  id: string; name: string; bed: string; sleeps: number; price: number; desc: string;
  amenities: string[]; gallery: string[]; isNew: boolean;
  booked: number[]; blocked: number[]; arriving: number[];
  openNights: number; daysInMonth: number; bookedThisWeek: number;
}
export interface Booking {
  id: string; ref: string; guest: string; email: string; phone: string; room: string; roomId: string;
  stay: string; checkin: string; checkout: string; nights: number; adults: number; children: number;
  total: number; status: string; baseStatus: string; color: string; source: string; bookedBy: string; payment: string; notes: string;
  createdAt: string;
}
export interface Overview {
  today: string;
  kpis: Record<"occupancy" | "revenue" | "adr" | "revpar", { value: string; delta: string; sparkline: number[] }>;
  revenueSeries: { label: string; value: number }[];
  sources: { label: string; v: number; c: string }[];
  arrivals: { ref: string; name: string; room: string; detail: string }[];
  departures: { ref: string; name: string; room: string; status: string }[];
  insight: { text: string; ai: boolean };
}
// Computed by the API from the bookings table (stays/ltv/tier) + the guest's
// own reviews (rating — null when they haven't left one).
export interface Guest { name: string; email: string; stays: number; ltv: number; ltvLabel: string; rating: string | null; tier: string }
export interface Review { id: string; guest: string; email: string; rating: number; roomName: string; text: string; reply: string; draft: string; featured: boolean; createdAt: string }
export interface ReplyResult extends Review { emailed: boolean; sentTo: string }
export interface Staff { id: string; n: string; role: string; perms: string; email: string; last: string; you: boolean }
export interface Promo {
  id: string; code: string; title: string;
  startsAt: string | null; endsAt: string | null; paused: boolean;
  status: "Active" | "Scheduled" | "Expired" | "Paused"; windowLabel: string; // derived server-side from the dates
  redemptions: number; attributed: number; attributedLabel: string;
}
export interface PriceSuggestion {
  id: string; roomId: string; room: string; when: string; change: string;
  why: string; lift: string; positive: boolean; target: number; estImpact: number;
}
export interface Pricing { enabled: boolean; suggestions: PriceSuggestion[] }
export interface Reports {
  topGuests: { name: string; rev: string; revNum: number }[];
  leadTime: { label: string; v: number }[];
  avgStay: string;
}

async function req<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((init?.headers as Record<string, string>) || {}) };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { clearToken(); throw new Error("Session expired — please sign in again."); }
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  const t = getToken();
  const res = await fetch(`${API}/admin/uploads`, {
    method: "POST",
    headers: t ? { Authorization: `Bearer ${t}` } : undefined,
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
  return (data as { urls: string[] }).urls;
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false),
  me: () => req<AuthUser>("/auth/me"),
  overview: () => req<Overview>("/admin/overview"),
  hotel: () => req<Hotel>("/admin/hotel"),
  updateHotel: (body: { goodToKnow?: GoodToKnow[]; payNowDiscount?: number }) => req<Hotel>("/admin/hotel", { method: "PATCH", body: JSON.stringify(body) }),
  bookings: () => req<{ bookings: Booking[]; counts: Record<string, number> }>("/admin/bookings"),
  createBooking: (body: Record<string, unknown>) => req<Booking>("/admin/bookings", { method: "POST", body: JSON.stringify(body) }),
  cancelBooking: (ref: string) => req<Booking>(`/admin/bookings/${ref}/cancel`, { method: "POST" }),
  rooms: () => req<Room[]>("/admin/rooms"),
  addRoom: (body: Record<string, unknown>) => req<Room>("/admin/rooms", { method: "POST", body: JSON.stringify(body) }),
  updateRoom: (id: string, body: Record<string, unknown>) => req<Room>(`/admin/rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRoom: (id: string) => req<{ ok: boolean }>(`/admin/rooms/${id}`, { method: "DELETE" }),
  guests: () => req<Guest[]>("/admin/guests"),
  reviews: () => req<Review[]>("/admin/reviews"),
  draftReply: (id: string) => req<Review>(`/admin/reviews/${id}/draft`, { method: "POST" }),
  sendReply: (id: string, reply?: string) => req<ReplyResult>(`/admin/reviews/${id}/reply`, { method: "POST", body: JSON.stringify({ reply }) }),
  featureReview: (id: string, featured: boolean) => req<Review>(`/admin/reviews/${id}/feature`, { method: "POST", body: JSON.stringify({ featured }) }),
  staff: () => req<Staff[]>("/admin/staff"),
  addStaff: (body: { name: string; email: string; role: string; perms: string[] }) => req<Staff>("/admin/staff", { method: "POST", body: JSON.stringify(body) }),
  promos: () => req<Promo[]>("/admin/promos"),
  addPromo: (body: Record<string, unknown>) => req<Promo>("/admin/promos", { method: "POST", body: JSON.stringify(body) }),
  pausePromo: (id: string, paused: boolean) => req<Promo>(`/admin/promos/${id}`, { method: "PATCH", body: JSON.stringify({ paused }) }),
  reports: () => req<Reports>("/admin/reports"),
  pricing: () => req<Pricing>("/admin/pricing"),
  approvePrice: (roomId: string, target: number) =>
    req<{ ok: boolean; roomId: string; price: number; was: number }>("/admin/pricing/approve", { method: "POST", body: JSON.stringify({ roomId, target }) }),
};
