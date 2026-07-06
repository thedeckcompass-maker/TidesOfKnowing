export type MemberWorkspaceSection = "commons" | "account" | "admin";

export function isMemberWorkspaceRoute(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false;
  return pathname.startsWith("/community") || pathname.startsWith("/ask-leilia/admin");
}

export function getMemberWorkspaceSection(pathname: string): MemberWorkspaceSection {
  if (pathname.startsWith("/community/account")) return "account";
  if (pathname.startsWith("/ask-leilia/admin")) return "admin";
  return "commons";
}
