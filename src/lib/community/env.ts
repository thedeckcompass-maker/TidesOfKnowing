type RuntimeLocals = {
  runtime?: {
    env?: Record<string, string | undefined>;
  };
};

export type CommunityEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  communityAdminEmails: string[];
  emailApiKey: string;
};

function runtimeEnv(locals?: unknown): Record<string, string | undefined> {
  return (locals as RuntimeLocals | undefined)?.runtime?.env ?? {};
}

function readEnv(name: string, locals?: unknown): string {
  const runtimeValue = runtimeEnv(locals)[name];
  const viteValue = import.meta.env[name] as string | undefined;
  return runtimeValue ?? viteValue ?? "";
}

export function communityEnv(locals?: unknown): CommunityEnv {
  const adminEmails = readEnv("COMMUNITY_ADMIN_EMAILS", locals)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return {
    supabaseUrl: readEnv("PUBLIC_SUPABASE_URL", locals),
    supabaseAnonKey: readEnv("PUBLIC_SUPABASE_ANON_KEY", locals),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY", locals),
    communityAdminEmails: adminEmails,
    emailApiKey: readEnv("EMAIL_API_KEY", locals),
  };
}

export function hasSupabaseConfig(locals?: unknown): boolean {
  const env = communityEnv(locals);
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
