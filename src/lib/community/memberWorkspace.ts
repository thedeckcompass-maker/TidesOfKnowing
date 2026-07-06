export type MemberWorkspaceSection = "commons" | "account" | "ask-leilia" | "admin";

/**
 * Authenticated route prefixes that inherit the Member Workspace header.
 * Ask Leilia member hub routes live under `/ask-leilia` (checkout, requests, etc.).
 */
const MEMBER_WORKSPACE_PREFIXES = ["/community", "/ask-leilia"] as const;

export function isMemberWorkspaceRoute(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false;
  return MEMBER_WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getMemberWorkspaceSection(pathname: string): MemberWorkspaceSection {
  if (pathname.startsWith("/community/account")) return "account";
  if (pathname.startsWith("/ask-leilia/admin")) return "admin";
  if (pathname === "/ask-leilia" || pathname.startsWith("/ask-leilia/")) return "ask-leilia";
  return "commons";
}
