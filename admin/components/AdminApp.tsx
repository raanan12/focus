'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dashboard } from './Dashboard';
import { Mfa } from './Mfa';

type Phase = 'loading' | 'login' | 'mfa' | 'ready';

export function AdminApp() {
  const [phase, setPhase] = useState<Phase>('loading');

  const evaluate = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return setPhase('login');
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setPhase(aal?.currentLevel === 'aal2' ? 'ready' : 'mfa');
  }, []);

  useEffect(() => {
    void evaluate();
    const { data } = supabase.auth.onAuthStateChange(() => void evaluate());
    return () => data.subscription.unsubscribe();
  }, [evaluate]);

  if (phase === 'loading') return <p className="p-8 text-neutral-500">טוען…</p>;
  if (phase === 'login') return <Login />;
  if (phase === 'mfa') return <Mfa onDone={evaluate} />;
  return <Dashboard />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true); setErr('');
    // shouldCreateUser:false → this page can never be used to register new accounts
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } });
    setBusy(false);
    if (error) setErr('לא ניתן לשלוח קוד'); else setSent(true);
  };
  const verify = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setErr('קוד שגוי או שפג תוקפו');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">פוקוס · ניהול</h1>
      {!sent ? (
        <>
          <input className="rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900" dir="ltr" type="email" autoComplete="email"
            placeholder="אימייל מנהל" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={busy || !email} onClick={send} className="rounded-full bg-black p-4 font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black">שלחו לי קוד</button>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">שלחנו קוד בן 6 ספרות ל-{email}</p>
          <input className="rounded-2xl bg-neutral-100 p-4 text-center text-2xl tracking-[0.5em] dark:bg-neutral-900" dir="ltr" inputMode="numeric"
            maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <button disabled={busy || code.length !== 6} onClick={verify} className="rounded-full bg-black p-4 font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black">אימות</button>
        </>
      )}
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
    </main>
  );
}
