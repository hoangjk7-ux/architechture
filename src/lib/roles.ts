export const ROLE_LABELS: Record<string, string> = {
  cto: "CTO",
  it_manager: "IT MANAGER",
  business_owner: "BUSINESS OWNER",
  viewer: "VIEWER",
};

export function formatRole(role?: string | null) {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").toUpperCase();
}
