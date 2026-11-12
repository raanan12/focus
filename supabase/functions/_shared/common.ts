import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
}

/** Service-role client. NEVER expose to clients; only used inside Edge Functions. */
export function serviceClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Validates the caller's JWT against Supabase Auth and returns the user. */
export async function authUser(req: Request): Promise<User | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await serviceClient().auth.getUser(token);
  return error ? null : data.user;
}

// ---- minimal Stripe REST client (no SDK → no supply-chain surface) ----

function encodeForm(obj: Record<string, unknown>, prefix = '', out: string[] = []): string[] {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') encodeForm(v as Record<string, unknown>, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

export async function stripe<T = any>(
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const body = encodeForm(params).join('&');
  const url = `https://api.stripe.com/v1${path}${method === 'GET' && body ? `?${body}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' ? body : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe error ${res.status}`);
  return data as T;
}

/** Writes Stripe's view of a subscription into our table (service role only). */
export async function syncSubscription(sub: any, userIdHint?: string) {
  const db = serviceClient();
  let userId: string | undefined = userIdHint ?? sub.metadata?.user_id;
  if (!userId) {
    const { data } = await db
      .from('subscriptions').select('user_id').eq('stripe_customer_id', sub.customer).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) return;
  const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  const iso = (s: number | null | undefined) => (s ? new Date(s * 1000).toISOString() : null);
  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: iso(periodEnd),
    cancel_at: iso(sub.cancel_at),
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}
