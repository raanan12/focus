import { createBrowserClient } from '@supabase/ssr';

// Only the public anon key lives here. All admin data goes through SECURITY DEFINER RPCs that
// check is_admin() (admin_users membership + TOTP aal2) inside Postgres — no service-role key anywhere.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Public by design (protected by RLS). Named without "KEY" so Vercel doesn't block the NEXT_PUBLIC_ prefix.
  (process.env.NEXT_PUBLIC_SUPABASE_ANON ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
);
