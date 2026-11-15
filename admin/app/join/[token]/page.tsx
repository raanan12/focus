// Public landing page for invite links: https://<domain>/join/<token>
// iOS opens the app directly (Universal Links); this page is the fallback when the app isn't installed.
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'פוקוס — הזמנה לפתק', robots: { index: false } };

function MiniNote({ className, rotate }: { className: string; rotate: string }) {
  return (
    <div className={`h-28 w-20 rounded-2xl p-3 shadow-card ${className}`} style={{ transform: `rotate(${rotate})` }} aria-hidden>
      <div className="mb-3 h-1.5 w-8 rounded-full bg-[#1d3146]/70" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-2 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] border border-[#1d3146]/40" /><span className="h-1 flex-1 rounded-full bg-[#1d3146]/25" /></div>
      ))}
    </div>
  );
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = /^[0-9a-f]{48}$/.test(token);
  const deepLink = valid ? `focus://join/${token}` : '#';
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-6">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brand opacity-[0.14] blur-3xl" />
      <div className="relative flex w-full max-w-md flex-col items-center gap-7 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="פוקוס" width={84} height={84} />
        <div className="flex items-center justify-center">
          <MiniNote className="bg-[#ffd3df]" rotate="-8deg" />
          <div className="-mx-2 z-10"><MiniNote className="bg-[#fff1a8]" rotate="0deg" /></div>
          <MiniNote className="bg-[#cfe5ff]" rotate="8deg" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">הוזמנת לפתק בפוקוס</h1>
          <p className="text-muted">{valid ? 'פתחו את הקישור באפליקציה כדי לראות מי הזמין אתכם ולהצטרף.' : 'הקישור אינו תקין.'}</p>
        </div>
        {valid && (
          <a href={deepLink} className="w-full rounded-full bg-brand px-8 py-4 text-lg font-bold text-on-brand shadow-card transition hover:opacity-90">פתח בפוקוס</a>
        )}
        <p className="text-sm text-faint">עוד לא התקנתם? הורידו את פוקוס מ-App Store ופתחו את הקישור שוב.</p>
      </div>
    </main>
  );
}
