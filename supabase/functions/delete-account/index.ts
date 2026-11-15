import { authUser, json, serviceClient } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);
    const db = serviceClient();

    // 1. hand shared notes to other members / drop solo notes
    const { error: prepErr } = await db.rpc('prepare_account_deletion', { p_user_id: user.id });
    if (prepErr) throw prepErr;

    // 2. delete the auth user (cascades to profile, memberships, ...)
    const { error: delErr } = await db.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;
    return json({ ok: true });
  } catch (e) {
    console.error('delete-account', e);
    return json({ error: 'server_error' }, 500);
  }
});
