// Public support page: https://<domain>/support  (App Store "Support URL")
import type { Metadata } from 'next';
import { CONTACT_EMAIL } from '@/lib/privacy';

export const metadata: Metadata = { title: 'Focus — תמיכה · Support', robots: { index: true, follow: true } };

const faq = [
  { q: 'איך אני משתף פתק? / How do I share a note?', a: 'בתוך הפתק לחץ על סמל השיתוף, והזן מייל או קוד שיתוף של חבר. אפשר גם לשלוח קישור בוואטסאפ. In a note, tap the share icon and enter a friend\'s e-mail or share code, or send a link on WhatsApp.' },
  { q: 'איפה קוד השיתוף שלי? / Where is my share code?', a: 'הגדרות ← "קוד השיתוף שלי". Settings → "Your share code".' },
  { q: 'איך מבטלים מנוי? / How do I cancel my subscription?', a: 'הגדרות ← ניהול מנוי, או בהגדרות ה-Apple ID / Google. Settings → Manage subscription, or in your Apple ID / Google settings.' },
  { q: 'איך מוחקים חשבון? / How do I delete my account?', a: 'הגדרות ← מחיקת חשבון. Settings → Delete account.' },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <div className="mb-8 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={44} height={44} />
        <h1 className="text-3xl font-extrabold tracking-tight">Focus · תמיכה / Support</h1>
      </div>
      <p className="text-muted">צריך עזרה? כתבו לנו ונחזור אליכם. / Need help? Write to us and we will get back to you.</p>
      <p className="mt-3"><a className="font-bold text-brand underline" href={`mailto:${CONTACT_EMAIL}`} dir="ltr">{CONTACT_EMAIL}</a></p>
      <div className="mt-10 space-y-6">
        {faq.map((f) => (
          <section key={f.q} className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <h2 className="font-bold">{f.q}</h2>
            <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-faint"><a className="underline" href="/privacy">מדיניות פרטיות</a> · <a className="underline" href="/privacy?lang=en">Privacy Policy</a></p>
    </main>
  );
}
