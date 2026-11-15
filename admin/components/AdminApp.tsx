'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dashboard } from './Dashboard';
import { Mfa } from './Mfa';
import { AuthShell, Button, inputCls } from './ui';

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

  if (phase === 'loading') return <main className="grid min-h-screen place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-brand" aria-label="טוען" /></main>;
  if (phase === 'login') return <Login />;
  if (phase === 'mfa') return <Mfa onDone={evaluate} />;
  return <Dashboard />;
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
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
  const google = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });   // trailing slash: must match the /** entry in Supabase's Redirect URLs
    if (error) { setBusy(false); setErr('לא ניתן להתחבר עם Google'); }
  };
  const verify = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setErr('קוד שגוי או שפג תוקפו');
  };

  return (
    <AuthShell title="פוקוס · ניהול" subtitle="כניסה למנהלים מורשים בלבד">
      {!sent ? (
        <>
          <button disabled={busy} onClick={google}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-brand px-6 py-3.5 text-base font-bold text-on-brand transition hover:opacity-90 disabled:opacity-40">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white"><GoogleG /></span>המשך עם Google
          </button>
          <div className="flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-line" />או<span className="h-px flex-1 bg-line" /></div>
          <input className={inputCls} dir="ltr" type="email" autoComplete="email" placeholder="אימייל מנהל" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="w-full !py-3" disabled={busy || !email} onClick={send}>שלחו לי קוד</Button>
        </>
      ) : (
        <>
          <p className="text-center text-sm text-muted">שלחנו קוד ל-<b className="text-ink" dir="ltr">{email}</b></p>
          <input className={`${inputCls} text-center text-2xl tracking-[0.5em]`} dir="ltr" inputMode="numeric"
            maxLength={8} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <Button variant="primary" className="w-full !py-3" disabled={busy || code.length < 6} onClick={verify}>אימות</Button>
        </>
      )}
      {err && <p role="alert" className="text-center text-sm font-medium text-bad">{err}</p>}
    </AuthShell>
  );
}
