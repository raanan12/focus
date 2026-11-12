# Duo — פתקים ומשימות משותפים

```
app/        אפליקציית Expo (React Native) ל-iOS ול-Android
admin/      לוח ניהול (Next.js) — רץ על Vercel, אין אליו גישה מהאפליקציה. כולל גם את דף /join/<token> לקישורי הזמנה
supabase/   schema.sql (טבלאות + RLS + פונקציות) ו-Edge Functions (תשלום Stripe)
```

## אבטחה — מה כבר בפנים
- RLS מופעל וכפוי על כל הטבלאות; הרשאות עמודות מינימליות (למשל אי אפשר לשנות `owner_id`).
- אין שום מפתח סודי באפליקציה או ב-Vercel. רק ה-anon key הציבורי. `service_role` ו-Stripe קיימים רק ב-Edge Functions.
- פרטי כרטיס אשראי נכנסים רק בדף של Stripe (Checkout) בתוך WebView — לא עוברים בשרתים שלך.
- Webhook של Stripe מאומת בחתימת HMAC + חלון זמן; המצב נקרא מחדש מ-Stripe בכל אירוע.
- קישורי הזמנה: טוקן אקראי 192 ביט, נשמר רק ה-hash, תוקף 7 ימים, מוגבל בשימושים, ניתן לביטול.
- סשן המשתמש נשמר ב-Keychain/Keystore (SecureStore) ולא ב-AsyncStorage.
- לוח הניהול: התחברות בקוד למייל + TOTP חובה. בדיקת ההרשאה נעשית בתוך Postgres (`is_admin()` דורש `aal2`).
- כותרות אבטחה (CSP, HSTS, X-Frame-Options, no-referrer) ב-`admin/next.config.ts`.

## התקנה — שלב אחר שלב

### 1. Supabase
1. צרו פרויקט ב-supabase.com.
2. SQL Editor → New query → הדביקו את כל `supabase/schema.sql` → Run.
3. Authentication → Providers: הפעילו **Email** (עם OTP), **Google**, ו-**Apple** (ל-iOS).
4. Authentication → URL Configuration → Redirect URLs, הוסיפו: `duo://auth-callback`
5. Project Settings → API: העתיקו `Project URL` ו-`anon public key`.

### 2. Stripe ($1 לחודש ל-12 חודשים)
1. Stripe Dashboard → Products → מוצר "Duo" → מחיר **$1.00, recurring, monthly**. העתיקו את ה-`price_...`.
2. Developers → Webhooks → Add endpoint:
   `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
   אירועים: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. העתיקו את ה-`whsec_...`.
3. פריסת הפונקציות (דורש Supabase CLI: `brew install supabase/tap/supabase`):
```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_PRICE_ID=price_... STRIPE_WEBHOOK_SECRET=whsec_... CHECKOUT_RETURN_URL=https://<VERCEL_DOMAIN>
supabase functions deploy create-checkout cancel-subscription delete-account stripe-webhook
```
(`SUPABASE_URL` ו-`SUPABASE_SERVICE_ROLE_KEY` מוזרקים אוטומטית לפונקציות.)

המנוי מסתיים אוטומטית אחרי 12 חיובים (ה-webhook קובע `cancel_at`).

### 3. האפליקציה
```bash
cd app
cp .env.example .env     # מלאו URL, anon key ודומיין Vercel
npm install
npx expo start           # סריקת QR עם Expo Go (התחברות Apple / בנייה מלאה דורשים dev build)
```
בנייה לחנויות: `npx eas-cli build --platform all`. החליפו את `com.duo.notes` ב-`app/app.json` במזהה שלכם.

### 4. לוח הניהול (Vercel)
1. vercel.com → Add New Project → בחרו את הריפו → **Root Directory: `admin`**.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. התחברו פעם אחת לאפליקציה עם המייל שלכם (כדי שייווצר משתמש), ואז ב-SQL Editor:
```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'YOUR_EMAIL@example.com';
```
4. היכנסו לכתובת Vercel מהמחשב: קוד למייל → סריקת QR של TOTP → לוח הנתונים.

### 5. GitHub
```bash
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```
