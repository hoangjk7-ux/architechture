export type UserRole = "cto" | "it_manager" | "business_owner" | "viewer";

export const routeRoles = {
  dashboard: ["cto", "it_manager", "business_owner", "viewer"],
  systems: ["cto", "it_manager", "business_owner", "viewer"],
  vendors: ["cto", "it_manager", "business_owner", "viewer"],
  architecture: ["cto", "it_manager", "business_owner", "viewer"],
  integrations: ["cto", "it_manager", "viewer"],
  roadmap: ["cto", "it_manager", "business_owner", "viewer"],
  users: ["cto"],
  settings: ["cto", "it_manager"],
} as const satisfies Record<string, readonly UserRole[]>;
