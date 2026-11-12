// Stripe → Supabase. Authenticated ONLY by Stripe's HMAC signature.
import { env, json, stripe, syncSubscription } from '../_shared/common.ts';

const TOLERANCE_SECONDS = 300;
const enc = new TextEncoder();

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verify(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = header.split(',').map((p) => p.split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((s) => safeEqual(s, expected));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const payload = await req.text();
  if (!(await verify(payload, req.headers.get('stripe-signature'), env('STRIPE_WEBHOOK_SECRET')))) {
    return json({ error: 'bad_signature' }, 400);
  }

  try {
    const event = JSON.parse(payload);
    const obj = event.data?.object;
    let subId: string | undefined;

    if (event.type === 'checkout.session.completed' && obj?.mode === 'subscription') subId = obj.subscription;
    else if (event.type?.startsWith('customer.subscription.')) subId = obj?.id;
    else if (event.type === 'invoice.payment_failed' || event.type === 'invoice.paid') {
      subId = obj?.subscription ?? obj?.parent?.subscription_details?.subscription;
    }
    if (!subId) return json({ received: true });

    // Always re-read the subscription from Stripe → immune to out-of-order webhook delivery.
    let sub = await stripe('GET', `/subscriptions/${subId}`);

    // "Monthly for one year": schedule the end of the subscription 364 days after it started
    // (= exactly 12 monthly charges, no 13th invoice race on the anniversary).
    if (!sub.cancel_at && !sub.cancel_at_period_end && sub.status !== 'canceled') {
      const start = sub.start_date ?? sub.created;
      sub = await stripe('POST', `/subscriptions/${subId}`, { cancel_at: start + 364 * 86400 });
    }

    await syncSubscription(sub, obj?.client_reference_id ?? undefined);
    return json({ received: true });
  } catch (e) {
    console.error('stripe-webhook', e);
    return json({ error: 'server_error' }, 500); // Stripe will retry
  }
});
