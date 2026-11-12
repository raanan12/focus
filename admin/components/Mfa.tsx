'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">אימות דו-שלבי</h1>
      {enroll ? (
        <>
          <p className="text-sm text-neutral-500">סרקו באפליקציית אימות (Google Authenticator / 1Password / Authy) והזינו את הקוד.</p>
          <div className="self-center rounded-2xl bg-white p-4"><QRCodeSVG value={enroll.uri} size={176} /></div>
          <p className="break-all text-center text-xs text-neutral-500" dir="ltr">{enroll.secret}</p>
        </>
      ) : <p className="text-sm text-neutral-500">הזינו את הקוד מאפליקציית האימות.</p>}
      <input className="rounded-2xl bg-neutral-100 p-4 text-center text-2xl tracking-[0.5em] dark:bg-neutral-900" dir="ltr" inputMode="numeric" maxLength={6}
        autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
      <button disabled={busy || code.length !== 6 || !factorId} onClick={verify} className="rounded-full bg-black p-4 font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black">אימות</button>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button onClick={() => supabase.auth.signOut()} className="text-sm text-neutral-500 underline">התנתקות</button>
    </main>
  );
}
