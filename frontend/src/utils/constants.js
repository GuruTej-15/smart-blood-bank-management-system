export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const PRIORITY_STYLES = {
  critical: "bg-pulse-light text-pulse border-pulse/30",
  high: "bg-amber-light text-amber border-amber/30",
  medium: "bg-stone text-muted border-stone-dark",
  normal: "bg-stone text-muted border-stone-dark",
};

export const STATUS_STYLES = {
  pending: "bg-amber-light text-amber border-amber/30",
  approved: "bg-crimson-light text-crimson border-crimson/30",
  fulfilled: "bg-vital-light text-vital border-vital/30",
  rejected: "bg-stone text-muted border-stone-dark",
};

export const REWARD_STYLES = {
  Bronze: "bg-[#f5e6d8] text-[#92451c] border-[#d8b896]",
  Silver: "bg-[#eceff1] text-[#52606d] border-[#cfd8dc]",
  Gold: "bg-[#fef3c7] text-[#92600a] border-[#facc15]/40",
  Platinum: "bg-[#e0e7ff] text-[#3730a3] border-[#a5b4fc]",
};

export const STAFF_ROLES = ["admin", "hospital"];
export const ADMIN_ROLES = ["admin"];
export const HOSPITAL_ROLES = ["hospital"];

export function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "hospital") return "hospital";
  if (normalized === "donor") return "donor";
  return "donor";
}

export function getLandingPath(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return "/admin-portal";
  if (normalizedRole === "hospital") return "/hospital-portal";
  return "/my-profile";
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
