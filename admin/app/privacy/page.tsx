// Public privacy policy: https://<domain>/privacy (Hebrew) and /privacy?lang=en (English)
import type { Metadata } from 'next';
import { CONTACT_EMAIL, POLICY_DATE, policy } from '@/lib/privacy';

export const metadata: Metadata = {
  title: 'Focus — מדיניות פרטיות · Privacy Policy',
  robots: { index: true, follow: true },
};

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const l: 'he' | 'en' = lang === 'en' ? 'en' : 'he';
  const p = policy[l];
  const dir = l === 'he' ? 'rtl' : 'ltr';

  return (
    <main dir={dir} lang={l} className="mx-auto max-w-3xl px-5 py-10 md:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={40} height={40} />
          <span className="text-lg font-extrabold tracking-tight">{l === 'he' ? 'פוקוס' : 'Focus'}</span>
        </div>
        <nav className="inline-flex rounded-full border border-line bg-surface-2 p-1 text-sm font-semibold" aria-label="Language">
          <a href="/privacy" className={`rounded-full px-3 py-1 ${l === 'he' ? 'bg-brand text-on-brand' : 'text-muted'}`}>עברית</a>
          <a href="/privacy?lang=en" className={`rounded-full px-3 py-1 ${l === 'en' ? 'bg-brand text-on-brand' : 'text-muted'}`}>English</a>
        </nav>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{p.title}</h1>
      <p className="mt-2 text-muted">{p.subtitle}</p>
      <p className="mt-1 text-sm text-faint">{p.updated} {POLICY_DATE[l]}</p>

      <div className="mt-10 space-y-9">
        {p.sections.map((s) => (
          <section key={s.title} className="space-y-3">
            <h2 className="text-xl font-bold">{s.title}</h2>
            {s.body.map((b, i) => Array.isArray(b)
              ? <ul key={i} className="list-disc space-y-1.5 ps-6 leading-relaxed text-muted marker:text-brand">{b.map((x) => <li key={x}>{x}</li>)}</ul>
              : <p key={i} className="leading-relaxed text-muted">{b}</p>)}
            {s.title.startsWith('10.') && (
              <p><a className="font-bold text-brand underline" href={`mailto:${CONTACT_EMAIL}`} dir="ltr">{CONTACT_EMAIL}</a></p>
            )}
          </section>
        ))}
      </div>

      <footer className="mt-14 border-t border-line pt-6 text-sm text-faint">© {new Date().getFullYear()} Focus</footer>
    </main>
  );
}
