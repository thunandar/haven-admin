import type { AuthUser } from "./api";

// Portal areas — keys match both the sidebar tab keys and the API's RBAC areas.
export const AREAS: { key: string; label: string }[] = [
  { key: "bookings", label: "Bookings" },
  { key: "rooms", label: "Rooms" },
  { key: "availability", label: "Availability" },
  { key: "pricing", label: "Pricing" },
  { key: "guests", label: "Guests" },
  { key: "reviews", label: "Reviews" },
  { key: "promos", label: "Promotions" },
  { key: "reports", label: "Reports" },
  { key: "staff", label: "Staff" },
  { key: "settings", label: "Settings" },
];

const ALL = AREAS.map((a) => a.key);

// Suggested access per role — prefills the Add-member form, editable per person.
export const ROLE_PERMS: Record<string, string[]> = {
  "Front desk": ["bookings", "guests"],
  Manager: ALL,
  Housekeeping: ["availability", "rooms"],
  Concierge: ["bookings", "guests", "promos"],
  Maintenance: ["rooms", "availability"],
  "Night manager": ["bookings", "guests"],
  Kitchen: ["availability"],
};

export const can = (user: AuthUser, area: string) =>
  user.isOwner || (Array.isArray(user.perms) && user.perms.includes(area));
