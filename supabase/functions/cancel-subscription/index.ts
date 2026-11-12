import { authUser, json, serviceClient, stripe, syncSubscription } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);
    const { data } = await serviceClient()
      .from('subscriptions').select('stripe_subscription_id').eq('user_id', user.id).maybeSingle();
    if (!data?.stripe_subscription_id) return json({ error: 'no_subscription' }, 404);

    // Cancels at the end of the paid period (user keeps access until then).
    const sub = await stripe('POST', `/subscriptions/${data.stripe_subscription_id}`, { cancel_at_period_end: true });
    await syncSubscription(sub, user.id);
    return json({ ok: true });
  } catch (e) {
    console.error('cancel-subscription', e);
    return json({ error: 'server_error' }, 500);
  }
});
