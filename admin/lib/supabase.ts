import { createBrowserClient } from '@supabase/ssr';

// Only PUBLIC values live here. The anon key is public by design (it ships inside the mobile app too);
// data is protected by Row Level Security, and all admin data goes through SECURITY DEFINER RPCs that
// check is_admin() (admin_users membership + TOTP aal2) inside Postgres — no service-role key anywhere.
// Environment variables override these defaults, so no Vercel configuration is required.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://miwirqtqkxrtrervveig.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pd2lycXRxa3hydHJlcnZ2ZWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NzAzMzMsImV4cCI6MjExMDA0NjMzM30.ihQWi6NbVED08cYSH4Mkl36JCpzlMHAm_gLawqkN0bw';

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
