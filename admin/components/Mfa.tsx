'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { AuthShell, Button, inputCls } from './ui';

// Second factor (TOTP). The database refuses every admin RPC until the session is aal2.
export function Mfa({ onDone }: { onDone: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ uri: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.[0];
      if (verified) { setFactorId(verified.id); return; }
      // drop abandoned, unverified factors, then enroll a fresh one
      for (const f of data?.all ?? []) if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data: e, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `admin-${Date.now()}` });
      if (error || !e) { setErr('לא ניתן להפעיל אימות דו-שלבי'); return; }
      setFactorId(e.id);
      setEnroll({ uri: e.totp.uri, secret: e.totp.secret });
    })();
  }, []);

  const verify = async () => {
    if (!factorId) return;
    setBusy(true); setErr('');
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (error) setErr('קוד שגוי'); else onDone();
  };

  return (
    <AuthShell title="אימות דו-שלבי" subtitle={enroll ? 'הגדרה חד-פעמית' : 'הזינו את הקוד מאפליקציית האימות'}>
      {enroll ? (
        <>
          <p className="text-center text-sm text-muted">סרקו באפליקציית אימות (Google Authenticator / 1Password / Authy) והזינו את הקוד בן 6 הספרות.</p>
          <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-card"><QRCodeSVG value={enroll.uri} size={176} /></div>
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="mb-1 text-xs text-muted">או הזינו ידנית את המפתח:</p>
            <p className="break-all font-mono text-xs font-semibold select-all" dir="ltr">{enroll.secret}</p>
          </div>
        </>
      ) : null}
      <input className={`${inputCls} text-center text-2xl tracking-[0.5em]`} dir="ltr" inputMode="numeric" maxLength={6}
        autoComplete="one-time-code" placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
      <Button variant="primary" className="w-full !py-3" disabled={busy || code.length !== 6 || !factorId} onClick={verify}>אימות</Button>
      {err && <p role="alert" className="text-center text-sm font-medium text-bad">{err}</p>}
      <button onClick={() => supabase.auth.signOut()} className="block w-full text-center text-sm text-muted underline">התנתקות</button>
    </AuthShell>
  );
}
