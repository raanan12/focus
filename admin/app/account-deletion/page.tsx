// Public "how to delete your account" page (required by Google Play's Data safety form).
import type { Metadata } from 'next';
import { CONTACT_EMAIL } from '@/lib/privacy';

export const metadata: Metadata = { title: 'Focus — מחיקת חשבון · Delete account', robots: { index: true, follow: true } };

export default async function AccountDeletionPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const en = lang === 'en';
  return (
    <main dir={en ? 'ltr' : 'rtl'} lang={en ? 'en' : 'he'} className="mx-auto max-w-2xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={40} height={40} />
          <span className="text-lg font-extrabold">{en ? 'Focus' : 'פוקוס'}</span>
        </div>
        <nav className="inline-flex rounded-full border border-line bg-surface-2 p-1 text-sm font-semibold" aria-label="Language">
          <a href="/account-deletion" className={`rounded-full px-3 py-1 ${!en ? 'bg-brand text-on-brand' : 'text-muted'}`}>עברית</a>
          <a href="/account-deletion?lang=en" className={`rounded-full px-3 py-1 ${en ? 'bg-brand text-on-brand' : 'text-muted'}`}>English</a>
        </nav>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight">{en ? 'Delete your account and data' : 'מחיקת החשבון והנתונים'}</h1>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">{en ? 'Option 1 — inside the app' : 'אפשרות 1 — מתוך האפליקציה'}</h2>
        <ol className="list-decimal space-y-1.5 ps-6 leading-relaxed text-muted marker:text-brand">
          {(en
            ? ['Open Focus and go to Settings.', 'Tap "Delete account".', 'Type the confirmation word and confirm.']
            : ['פתחו את פוקוס ועברו להגדרות.', 'לחצו על "מחיקת חשבון".', 'הקלידו את מילת האישור ואשרו.']
          ).map((x) => <li key={x}>{x}</li>)}
        </ol>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">{en ? 'Option 2 — by e-mail' : 'אפשרות 2 — במייל'}</h2>
        <p className="leading-relaxed text-muted">
          {en ? 'If you cannot access the app, e-mail us from the address registered to your account and ask us to delete it: '
              : 'אם אין לכם גישה לאפליקציה, שלחו לנו מייל מהכתובת הרשומה בחשבון וביקשו למחוק אותו: '}
          <a className="font-bold text-brand underline" href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20Focus%20account`} dir="ltr">{CONTACT_EMAIL}</a>
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">{en ? 'What is deleted' : 'מה נמחק'}</h2>
        <ul className="list-disc space-y-1.5 ps-6 leading-relaxed text-muted marker:text-brand">
          {(en
            ? ['Your account, profile, e-mail address and display name.',
               'Notes that are not shared with anyone else.',
               'Notes shared with other people are handed over to one of the other members so they are not lost; tasks you added remain for them, without any link to your account.',
               'Provider backups may persist for a limited time after deletion.']
            : ['החשבון, הפרופיל, כתובת המייל ושם התצוגה שלכם.',
               'פתקים שאינם משותפים עם אחרים.',
               'פתקים משותפים מועברים לאחד מהשותפים כדי שלא יאבדו להם; משימות שהוספתם נשארות אצלם ללא קישור לחשבונכם.',
               'גיבויים של ספקי התשתית עשויים להישמר לתקופה מוגבלת לאחר המחיקה.']
          ).map((x) => <li key={x}>{x}</li>)}
        </ul>
        <p className="leading-relaxed text-muted">
          {en ? 'An active subscription is not cancelled automatically. Cancel it in Google Play (Payments & subscriptions) or your Apple ID settings.'
              : 'מנוי פעיל אינו מתבטל אוטומטית. יש לבטל אותו ב-Google Play (תשלומים ומינויים) או בהגדרות ה-Apple ID.'}
        </p>
      </section>

      <p className="mt-10 text-sm text-faint"><a className="underline" href={en ? '/privacy?lang=en' : '/privacy'}>{en ? 'Privacy Policy' : 'מדיניות פרטיות'}</a></p>
    </main>
  );
}
