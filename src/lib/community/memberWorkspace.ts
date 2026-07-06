export type MemberWorkspaceSection = "commons" | "account" | "admin";

/** Add new authenticated member route prefixes here to inherit the Member Workspace header. */
const MEMBER_WORKSPACE_PREFIXES = ["/community", "/ask-leilia/admin"] as const;

export function isMemberWorkspaceRoute(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false;
  return MEMBER_WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getMemberWorkspaceSection(pathname: string): MemberWorkspaceSection {
  if (pathname.startsWith("/community/account")) return "account";
  if (pathname.startsWith("/ask-leilia/admin")) return "admin";
  return "commons";
}
