'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Avatar, Bar, Button, Card, CardTitle, Icon, IconBadge, Segmented, StatusBadge, inputCls } from './ui';

type Overview = {
  total_users: number; new_today: number; new_7d: number; new_30d: number; active_7d: number;
  paying_users: number; past_due_users: number; canceled_users: number; trial_users: number; mrr_usd: number;
  total_notes: number; shared_notes: number; total_tasks: number; done_tasks: number;
};
type Day = { day: string; signups: number; new_paying: number };
type UserRow = { id: string; email: string; display_name: string; created_at: string; last_sign_in_at: string | null; status: string; notes_count: number };

const PAGE = 25;
const nf = new Intl.NumberFormat('he-IL');
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '0%');
const pctNum = (a: number, b: number) => (b ? (a / b) * 100 : 0);

function relative(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 30) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: '2-digit' });
}

const tooltipStyle = {
  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, color: 'var(--ink)',
  boxShadow: 'var(--shadow)', fontSize: 13, direction: 'rtl' as const,
};

/* ---------- KPI card ---------- */
function Kpi({ label, value, icon, tone = 'brand', hint, spark, sparkColor = 'var(--brand)' }:
  { label: string; value: string | number; icon: string; tone?: 'brand' | 'good' | 'warn' | 'bad'; hint?: React.ReactNode; spark?: number[]; sparkColor?: string }) {
  const id = useMemo(() => `sp-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-1.5 text-3xl font-extrabold tabular-nums tracking-tight md:text-4xl">{typeof value === 'number' ? nf.format(value) : value}</p>
        </div>
        <IconBadge name={icon} tone={tone} />
      </div>
      {hint && <div className="mt-3 text-sm text-muted">{hint}</div>}
      {spark && spark.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-70" dir="ltr">
          <ResponsiveContainer>
            <AreaChart data={spark.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} /><stop offset="100%" stopColor={sparkColor} stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function Pill({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'good' }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone === 'good' ? 'bg-good/15 text-good' : 'bg-brand-soft text-brand'}`}>{children}</span>;
}

function Dot({ color }: { color: string }) { return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />; }

/* ---------- page ---------- */
export function Dashboard() {
  const [o, setO] = useState<Overview | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(30);
  const [err, setErr] = useState('');
  const [updated, setUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    const [a, b] = await Promise.all([supabase.rpc('admin_overview'), supabase.rpc('admin_daily', { p_days: range })]);
    if (a.error || b.error) { setErr('אין הרשאה — ודאו שהמשתמש מופיע ב-admin_users'); return; }
    setO(a.data as Overview);
    setDays(((b.data as Day[]) ?? []).map((d) => ({ ...d, day: new Date(d.day).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }) })));
    setUpdated(new Date());
  }, [range]);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_users_list', { p_limit: PAGE, p_offset: page * PAGE, p_search: search || null });
    if (!error) setRows((data as UserRow[]) ?? []);
  }, [page, search]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { const h = setTimeout(() => void loadUsers(), 250); return () => clearTimeout(h); }, [loadUsers]);

  const header = (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={36} height={36} />
          <div className="leading-tight">
            <h1 className="text-lg font-extrabold tracking-tight">פוקוס</h1>
            <p className="text-xs text-muted">לוח ניהול</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {updated && <span className="hidden text-xs text-faint sm:inline">עודכן {updated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>}
          <Button icon="refresh" onClick={() => { void loadStats(); void loadUsers(); }}>רענון</Button>
          <Button icon="logout" onClick={() => supabase.auth.signOut()}>התנתקות</Button>
        </div>
      </div>
    </header>
  );

  if (err) return (<>{header}<main className="mx-auto max-w-lg p-8"><Card><p role="alert" className="font-semibold text-bad">{err}</p></Card></main></>);
  if (!o) return (<>{header}<main className="mx-auto max-w-7xl space-y-5 p-4 md:p-8" aria-busy>{[0, 1].map((r) => (
    <div key={r} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-surface-2" />)}</div>))}</main></>);

  const free = Math.max(0, o.total_users - o.paying_users - o.trial_users - o.canceled_users - o.past_due_users);
  const donut = [
    { name: 'משלמים', value: o.paying_users, color: 'var(--good)' },
    { name: 'בניסיון', value: o.trial_users, color: 'var(--brand)' },
    { name: 'בחוב', value: o.past_due_users, color: 'var(--warn)' },
    { name: 'בוטלו', value: o.canceled_users, color: 'var(--bad)' },
    { name: 'חינם', value: free, color: 'var(--faint)' },
  ];
  const signupsSpark = days.map((d) => d.signups);
  const payingSpark = days.map((d) => d.new_paying);
  const totalInRange = days.reduce((s, d) => s + d.signups, 0);
  const funnel = [
    { label: 'נרשמו', value: o.total_users, tone: 'brand' as const },
    { label: 'פעילים ב-7 ימים', value: o.active_7d, tone: 'brand' as const },
    { label: 'בתקופת ניסיון', value: o.trial_users, tone: 'warn' as const },
    { label: 'משלמים', value: o.paying_users, tone: 'good' as const },
  ];

  return (
    <>
      {header}
      <main className="mx-auto max-w-7xl space-y-5 p-4 md:space-y-6 md:p-8">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">סקירה כללית</h2>
          <p className="mt-1 text-sm text-muted">מצב המוצר, המשתמשים וההכנסות במבט אחד.</p>
        </div>

        {/* KPIs */}
        <section aria-label="מדדים מרכזיים" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="סה״כ משתמשים" value={o.total_users} icon="users" spark={signupsSpark}
            hint={<div className="flex flex-wrap gap-1.5 pb-8"><Pill>+{o.new_today} היום</Pill><Pill>+{o.new_7d} בשבוע</Pill><Pill>+{o.new_30d} בחודש</Pill></div>} />
          <Kpi label="פעילים ב-7 ימים" value={o.active_7d} icon="pulse" tone="good" sparkColor="var(--good)"
            hint={<span className="pb-8 block"><b className="text-ink">{pct(o.active_7d, o.total_users)}</b> מכלל המשתמשים</span>} />
          <Kpi label="משתמשים משלמים" value={o.paying_users} icon="card" tone="warn" spark={payingSpark} sparkColor="var(--warn)"
            hint={<span className="pb-8 block">המרה לתשלום <b className="text-ink">{pct(o.paying_users, o.total_users)}</b></span>} />
          <Kpi label="הכנסה חודשית (MRR)" value={`$${nf.format(o.mrr_usd)}`} icon="coin" tone="good"
            hint={<span className="block">{o.past_due_users > 0 ? <><b className="text-warn">{o.past_due_users}</b> בחוב · </> : null}{o.canceled_users} ביטלו</span>} />
        </section>

        {/* chart + donut */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
          <Card className="lg:col-span-2">
            <CardTitle title="הרשמות ותשלומים חדשים" hint={`${nf.format(totalInRange)} הרשמות ב-${range} הימים האחרונים`}
              right={<Segmented value={range} onChange={setRange} options={[{ v: 7, label: '7 ימים' }, { v: 30, label: '30 יום' }, { v: 90, label: '90 יום' }]} />} />
            <div className="mb-3 flex gap-4 text-sm text-muted"><span className="flex items-center gap-2"><Dot color="var(--brand)" />הרשמות</span><span className="flex items-center gap-2"><Dot color="var(--good)" />תשלומים חדשים</span></div>
            <div className="h-72" dir="ltr">
              <ResponsiveContainer>
                <AreaChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="g-su" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--brand)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="g-pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--good)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--good)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 12 }} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 12 }} width={44} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--line)' }} />
                  <Area type="monotone" dataKey="signups" name="הרשמות" stroke="var(--brand)" strokeWidth={2.5} fill="url(#g-su)" />
                  <Area type="monotone" dataKey="new_paying" name="תשלומים חדשים" stroke="var(--good)" strokeWidth={2.5} fill="url(#g-pa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardTitle title="מצב מנויים" hint="חלוקת כלל המשתמשים" />
            <div className="relative mx-auto h-48 w-48" dir="ltr">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={2} stroke="none" isAnimationActive={false}>
                    {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div><p className="text-3xl font-extrabold tabular-nums">{nf.format(o.total_users)}</p><p className="text-xs text-muted">משתמשים</p></div>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {donut.map((d) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted"><Dot color={d.color} />{d.name}</span>
                  <span className="font-bold tabular-nums">{nf.format(d.value)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* funnel + usage */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
          <Card>
            <CardTitle title="משפך משתמשים" hint="מהרשמה ועד תשלום" />
            <div className="space-y-4">
              {funnel.map((f) => (
                <div key={f.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{f.label}</span>
                    <span className="tabular-nums text-muted"><b className="text-ink">{nf.format(f.value)}</b> · {pct(f.value, o.total_users)}</span>
                  </div>
                  <Bar value={f.value} max={o.total_users} tone={f.tone} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle title="שימוש באפליקציה" hint="פתקים ומשימות" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'note', label: 'פתקים', value: nf.format(o.total_notes) },
                { icon: 'share', label: 'פתקים משותפים', value: nf.format(o.shared_notes) },
                { icon: 'list', label: 'משימות', value: nf.format(o.total_tasks) },
                { icon: 'check', label: 'משימות שבוצעו', value: nf.format(o.done_tasks) },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5">
                  <IconBadge name={s.icon} />
                  <div className="min-w-0"><p className="text-xl font-extrabold tabular-nums">{s.value}</p><p className="truncate text-xs text-muted">{s.label}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">פתקים משותפים</span><b className="tabular-nums">{pct(o.shared_notes, o.total_notes)}</b></div>
                <Bar value={pctNum(o.shared_notes, o.total_notes)} max={100} />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">אחוז השלמת משימות</span><b className="tabular-nums">{pct(o.done_tasks, o.total_tasks)}</b></div>
                <Bar value={pctNum(o.done_tasks, o.total_tasks)} max={100} tone="good" />
              </div>
            </div>
          </Card>
        </section>

        {/* users */}
        <section aria-label="טבלת משתמשים">
          <Card className="!p-0 overflow-hidden">
            <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div><h2 className="text-base font-bold md:text-lg">רשימת משתמשים</h2><p className="mt-0.5 text-sm text-muted">הצטרפו לאחרונה למעלה</p></div>
              <div className="relative w-full md:w-72">
                <Icon name="search" size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
                <input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder="חיפוש לפי מייל או שם" dir="auto" className={`${inputCls} !rounded-full !py-2.5 ps-11 text-sm`} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {['משתמש', 'הצטרף', 'כניסה אחרונה', 'פתקים', 'סטטוס'].map((h) => <th key={h} className="px-5 py-3 text-start md:px-6">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                      <td className="px-5 py-3.5 md:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar id={r.id} name={r.display_name || r.email || '?'} />
                          <div className="min-w-0"><p className="truncate font-semibold">{r.display_name || '—'}</p><p className="truncate text-xs text-muted" dir="ltr">{r.email}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted md:px-6">{new Date(r.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                      <td className="px-5 py-3.5 text-muted md:px-6">{relative(r.last_sign_in_at)}</td>
                      <td className="px-5 py-3.5 font-semibold tabular-nums md:px-6">{r.notes_count}</td>
                      <td className="px-5 py-3.5 md:px-6"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={5} className="px-6 py-14 text-center text-muted">אין תוצאות</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line p-4 md:px-6">
              <span className="text-sm text-muted">עמוד {page + 1}</span>
              <div className="flex gap-2">
                <Button disabled={page === 0} onClick={() => setPage(page - 1)}>הקודם</Button>
                <Button disabled={rows.length < PAGE} onClick={() => setPage(page + 1)}>הבא</Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
