'use client';

import type { ReactNode } from 'react';

/* ---------- icons (inline, no dependency) ---------- */
const PATHS: Record<string, ReactNode> = {
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19c.4-3.2 3-5 6.2-5s5.8 1.8 6.2 5" /><circle cx="17.2" cy="9" r="2.4" /><path d="M16.5 14.2c2.6-.2 4.3 1.3 4.7 3.8" /></>,
  pulse: <path d="M3 12h4l2.5-6 4 12L16 12h5" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="M3 10h18M7 15h3" /></>,
  coin: <><circle cx="12" cy="12" r="8.5" /><path d="M14.6 9.3c-.5-.8-1.5-1.3-2.7-1.3-1.5 0-2.6.8-2.6 2 0 3 5.4 1.4 5.4 4.3 0 1.2-1.2 2-2.8 2-1.3 0-2.4-.5-3-1.4M12 6.5V8m0 8v1.5" /></>,
  note: <><path d="M6 3.5h9l3.5 3.5v13H6z" /><path d="M14.5 3.5V7.5h4M9 12h6M9 15.5h6" /></>,
  share: <><circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="6.5" r="2.4" /><circle cx="17.5" cy="17.5" r="2.4" /><path d="m8.1 10.8 7.3-3.2M8.1 13.2l7.3 3.2" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.7-5" /></>,
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.3-4M4 4v4h4M4 13a8 8 0 0 0 14.3 4M20 20v-4h-4" />,
  logout: <path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4M10 8l-4 4 4 4M6 12h10" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  shield: <path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.3 7 9 4.2-1.7 7-4.8 7-9V6z" />,
};
export function Icon({ name, size = 20, className = '' }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/* ---------- surfaces ---------- */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface p-5 shadow-card md:p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold md:text-lg">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function IconBadge({ name, tone = 'brand' }: { name: string; tone?: 'brand' | 'good' | 'warn' | 'bad' }) {
  const tones = { brand: 'bg-brand-soft text-brand', good: 'bg-good/15 text-good', warn: 'bg-warn/15 text-warn', bad: 'bg-bad/15 text-bad' };
  return <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}><Icon name={name} size={20} /></span>;
}

export function Button({ children, onClick, icon, variant = 'ghost', disabled, type = 'button', className = '' }:
  { children?: ReactNode; onClick?: () => void; icon?: string; variant?: 'primary' | 'ghost'; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  const v = variant === 'primary'
    ? 'bg-brand text-on-brand hover:opacity-90'
    : 'border border-line bg-surface text-ink hover:bg-surface-2';
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${v} ${className}`}>
      {icon && <Icon name={icon} size={16} />}{children}
    </button>
  );
}

export function Segmented<T extends number | string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface-2 p-1" role="tablist">
      {options.map((o) => (
        <button key={String(o.v)} role="tab" aria-selected={value === o.v} onClick={() => onChange(o.v)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${value === o.v ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Bar({ value, max, tone = 'brand' }: { value: number; max: number; tone?: 'brand' | 'good' | 'warn' }) {
  const w = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  const bg = { brand: 'bg-brand', good: 'bg-good', warn: 'bg-warn' }[tone];
  return <div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${bg}`} style={{ width: `${w}%` }} /></div>;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'משלם', cls: 'bg-good/15 text-good' },
  trialing: { label: 'ניסיון', cls: 'bg-brand-soft text-brand' },
  past_due: { label: 'חוב', cls: 'bg-warn/15 text-warn' },
  canceled: { label: 'בוטל', cls: 'bg-bad/15 text-bad' },
  none: { label: 'חינם', cls: 'bg-surface-2 text-muted' },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-surface-2 text-muted' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

const AVATARS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#EC407A', '#6D4C41', '#3949AB', '#546E7A'];
export function Avatar({ id, name }: { id: string; name: string }) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: AVATARS[h % AVATARS.length] }}>{(name.trim()[0] ?? '?').toUpperCase()}</span>;
}

/* ---------- centered auth layout (login / 2FA) ---------- */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-6">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand opacity-[0.12] blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="פוקוס" width={72} height={72} />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <Card className="space-y-4">{children}</Card>
      </div>
    </main>
  );
}

export const inputCls = 'w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-ink placeholder:text-faint focus:border-brand';
