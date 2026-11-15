// RevenueCat → Supabase. Mirrors the App Store subscription into public.subscriptions.
// Authenticated by a shared secret header (set the same value in RevenueCat → Webhooks → Authorization header).
// The webhook payload is only a trigger: we re-read the subscriber from RevenueCat's API, so out-of-order or
// replayed deliveries can never leave us with stale state.
import { env, json, serviceClient } from '../_shared/common.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENTITLEMENT = Deno.env.get('REVENUECAT_ENTITLEMENT') ?? 'pro';

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!safeEqual(req.headers.get('Authorization') ?? '', `Bearer ${env('REVENUECAT_WEBHOOK_AUTH')}`)) {
    return json({ error: 'unauthorized' }, 401);
  }

  try {
    const event = (await req.json())?.event;
    if (!event || event.type === 'TEST') return json({ received: true });

    // The app logs in to RevenueCat with the Supabase user id; fall back to aliases for transfers.
    const candidates: string[] = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].filter(Boolean);
    const userId = candidates.find((id) => UUID.test(id));
    if (!userId) return json({ received: true, ignored: 'no_user' });

    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${env('REVENUECAT_API_KEY')}` },
    });
    if (!res.ok) throw new Error(`revenuecat ${res.status}`);
    const subscriber = (await res.json()).subscriber;

    const ent = subscriber?.entitlements?.[ENTITLEMENT];
    const expires: string | null = ent?.expires_date ?? null;          // null = lifetime
    const active = !!ent && (expires === null || Date.parse(expires) > Date.now());
    const store = ent ? subscriber?.subscriptions?.[ent.product_identifier] : null;
    const willRenew = active && !store?.unsubscribe_detected_at;

    const { error } = await serviceClient().from('subscriptions').upsert({
      user_id: userId,
      status: active ? 'active' : ent ? 'canceled' : 'none',
      current_period_end: expires,
      cancel_at: active && !willRenew ? expires : null,
      cancel_at_period_end: active && !willRenew,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) {
      if (error.code === '23503') return json({ received: true, ignored: 'unknown_user' });   // user deleted meanwhile
      throw error;
    }
    return json({ received: true });
  } catch (e) {
    console.error('revenuecat-webhook', e);
    return json({ error: 'server_error' }, 500);        // RevenueCat retries on non-2xx
  }
});
