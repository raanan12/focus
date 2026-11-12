// Creates a Stripe-hosted Checkout Session ($1 / month). The app opens `url` in an in-app WebView,
// so card details only ever touch Stripe — never our servers (PCI SAQ-A).
import { authUser, env, json, serviceClient, stripe } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const db = serviceClient();
    const { data: row } = await db
      .from('subscriptions').select('stripe_customer_id,status').eq('user_id', user.id).maybeSingle();
    if (row && ['active', 'trialing'].includes(row.status)) return json({ error: 'already_subscribed' }, 409);

    let customer = row?.stripe_customer_id as string | undefined;
    if (!customer) {
      const c = await stripe('POST', '/customers', { email: user.email, metadata: { user_id: user.id } });
      customer = c.id;
      await db.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: 'user_id' });
    }

    const returnBase = env('CHECKOUT_RETURN_URL').replace(/\/$/, '');
    const successUrl = `${returnBase}/payment/success`;
    const cancelUrl = `${returnBase}/payment/cancel`;
    const session = await stripe('POST', '/checkout/sessions', {
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price: env('STRIPE_PRICE_ID'), quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: { metadata: { user_id: user.id } },
    });
    return json({ url: session.url, success_url: successUrl, cancel_url: cancelUrl });
  } catch (e) {
    console.error('create-checkout', e);
    return json({ error: 'server_error' }, 500);
  }
});
