'use client';

import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/lib/supabase';

type Overview = {
  total_users: number; new_today: number; new_7d: number; new_30d: number; active_7d: number;
  paying_users: number; past_due_users: number; canceled_users: number; trial_users: number; mrr_usd: number;
  total_notes: number; shared_notes: number; total_tasks: number; done_tasks: number;
};
type Day = { day: string; signups: number; new_paying: number };
type UserRow = { id: string; email: string; display_name: string; created_at: string; last_sign_in_at: string | null; status: string; notes_count: number };

const PAGE = 25;
const nf = new Intl.NumberFormat('he-IL');
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');
const statusLabel: Record<string, string> = { active: 'משלם', past_due: 'חוב', canceled: 'בוטל', trialing: 'ניסיון', none: 'חינם' };

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-3xl bg-neutral-100 p-5 dark:bg-neutral-900">
      <div className="text-3xl font-bold tabular-nums">{typeof value === 'number' ? nf.format(value) : value}</div>
      <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{label}</div>
      {hint && <div className="text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}

export function Dashboard() {
  const [o, setO] = useState<Overview | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(30);
  const [err, setErr] = useState('');

  const loadStats = useCallback(async () => {
    const [a, b] = await Promise.all([supabase.rpc('admin_overview'), supabase.rpc('admin_daily', { p_days: range })]);
    if (a.error || b.error) { setErr('אין הרשאה — ודאו שהמשתמש מופיע ב-admin_users'); return; }
    setO(a.data as Overview);
    setDays(((b.data as Day[]) ?? []).map((d) => ({ ...d, day: d.day.slice(5) })));
  }, [range]);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_users_list', { p_limit: PAGE, p_offset: page * PAGE, p_search: search || null });
    if (!error) setRows((data as UserRow[]) ?? []);
  }, [page, search]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { const h = setTimeout(() => void loadUsers(), 250); return () => clearTimeout(h); }, [loadUsers]);

  if (err) return <main className="p-8"><p role="alert" className="text-red-600">{err}</p><button className="mt-4 underline" onClick={() => supabase.auth.signOut()}>התנתקות</button></main>;
  if (!o) return <p className="p-8 text-neutral-500">טוען…</p>;

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">פוקוס · ניהול</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => { void loadStats(); void loadUsers(); }} className="rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-900">רענון</button>
          <button onClick={() => supabase.auth.signOut()} className="rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-900">התנתקות</button>
        </div>
      </header>

      <section aria-label="משתמשים" className="space-y-3">
        <h2 className="text-lg font-bold">משתמשים</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="סה״כ משתמשים" value={o.total_users} />
          <Stat label="חדשים היום" value={o.new_today} />
          <Stat label="חדשים ב-7 ימים" value={o.new_7d} />
          <Stat label="חדשים ב-30 יום" value={o.new_30d} />
          <Stat label="פעילים (7 ימים)" value={o.active_7d} hint="יצרו/עדכנו משימה או פתק" />
          <Stat label="בתקופת ניסיון" value={o.trial_users} />
        </div>
      </section>

      <section aria-label="הכנסות" className="space-y-3">
        <h2 className="text-lg font-bold">תשלומים</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="משתמשים משלמים" value={o.paying_users} />
          <Stat label="הכנסה חודשית (MRR)" value={`$${nf.format(o.mrr_usd)}`} />
          <Stat label="המרה לתשלום" value={pct(o.paying_users, o.total_users)} />
          <Stat label="בוטלו / בחוב" value={`${o.canceled_users} / ${o.past_due_users}`} />
        </div>
      </section>

      <section aria-label="שימוש" className="space-y-3">
        <h2 className="text-lg font-bold">שימוש</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="פתקים" value={o.total_notes} />
          <Stat label="פתקים משותפים" value={o.shared_notes} hint={pct(o.shared_notes, o.total_notes)} />
          <Stat label="משימות" value={o.total_tasks} />
          <Stat label="משימות שבוצעו" value={pct(o.done_tasks, o.total_tasks)} />
        </div>
      </section>

      <section aria-label="גרף" className="rounded-3xl bg-neutral-100 p-5 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">הרשמות ותשלומים חדשים</h2>
          <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="rounded-full bg-white px-3 py-1 text-sm dark:bg-neutral-800">
            <option value={7}>7 ימים</option><option value={30}>30 יום</option><option value={90}>90 יום</option>
          </select>
        </div>
        <div className="h-64" dir="ltr">
          <ResponsiveContainer>
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
              <Tooltip />
              <Line type="monotone" dataKey="signups" name="הרשמות" stroke="#2F7BFF" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="new_paying" name="תשלומים חדשים" stroke="#1E9E6A" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section aria-label="טבלת משתמשים" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">רשימת משתמשים</h2>
          <input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder="חיפוש לפי מייל או שם" dir="auto"
            className="w-64 rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-900" />
        </div>
        <div className="overflow-x-auto rounded-3xl bg-neutral-100 dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="text-neutral-500"><tr>
              {['שם', 'אימייל', 'הצטרף', 'כניסה אחרונה', 'פתקים', 'סטטוס'].map((h) => <th key={h} className="p-3 text-start font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-200/60 dark:border-neutral-800">
                  <td className="p-3">{r.display_name || '—'}</td>
                  <td className="p-3" dir="ltr">{r.email}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString('he-IL')}</td>
                  <td className="p-3">{r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleDateString('he-IL') : '—'}</td>
                  <td className="p-3 tabular-nums">{r.notes_count}</td>
                  <td className="p-3">{statusLabel[r.status] ?? r.status}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-neutral-500">אין תוצאות</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center gap-3">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm disabled:opacity-40 dark:bg-neutral-900">הקודם</button>
          <button disabled={rows.length < PAGE} onClick={() => setPage(page + 1)} className="rounded-full bg-neutral-100 px-4 py-2 text-sm disabled:opacity-40 dark:bg-neutral-900">הבא</button>
        </div>
      </section>
    </main>
  );
}
