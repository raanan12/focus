import { authUser, json, serviceClient } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);
    const db = serviceClient();

    // 1. stop billing immediately
    const { data } = await db
      .from('subscriptions').select('stripe_subscription_id,stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (data?.stripe_subscription_id) {
      try {
        const res = await fetch(`https://api.stripe.com/v1/subscriptions/${data.stripe_subscription_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
        });
        if (!res.ok && res.status !== 404) console.warn('stripe cancel failed', res.status);
      } catch (e) { console.warn('stripe cancel error', e); }
    }

    // 2. hand shared notes to other members / drop solo notes
    const { error: prepErr } = await db.rpc('prepare_account_deletion', { p_user_id: user.id });
    if (prepErr) throw prepErr;

    // 3. delete the auth user (cascades to profile, memberships, ...)
    const { error: delErr } = await db.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;
    return json({ ok: true });
  } catch (e) {
    console.error('delete-account', e);
    return json({ error: 'server_error' }, 500);
  }
});
