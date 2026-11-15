// Public landing page for invite links: https://<domain>/join/<token>
// Opens the app via its custom scheme; shows a fallback when the app isn't installed.
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'פוקוס — הזמנה לפתק', robots: { index: false } };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = /^[0-9a-f]{48}$/.test(token);
  const deepLink = valid ? `focus://join/${token}` : '#';
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex gap-2" aria-hidden>
        <span className="h-16 w-12 -rotate-6 rounded-2xl bg-yellow-200" />
        <span className="h-16 w-12 rounded-2xl bg-pink-200" />
        <span className="h-16 w-12 rotate-6 rounded-2xl bg-blue-200" />
      </div>
      <h1 className="text-3xl font-bold">הוזמנת לפתק בפוקוס</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        {valid ? 'פתחו את הקישור באפליקציה כדי לראות מי הזמין אתכם ולהצטרף.' : 'הקישור אינו תקין.'}
      </p>
      {valid && (
        <a href={deepLink} className="w-full rounded-full bg-black px-8 py-4 text-lg font-bold text-white dark:bg-white dark:text-black">
          פתח בפוקוס
        </a>
      )}
      <p className="text-sm text-neutral-500">עוד לא התקנתם? הורידו את פוקוס מ-App Store או מ-Google Play ופתחו את הקישור שוב.</p>
    </main>
  );
}
