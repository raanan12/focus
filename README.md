# Focus — פתקים ומשימות משותפים

```
app/        אפליקציית Expo (React Native) ל-iOS ול-Android
admin/      לוח ניהול (Next.js) — רץ על Vercel, אין אליו גישה מהאפליקציה. כולל גם את דף /join/<token> לקישורי הזמנה
supabase/   schema.sql (טבלאות + RLS + פונקציות) ו-Edge Functions (webhook של RevenueCat, מחיקת חשבון)
```

## אבטחה — מה כבר בפנים
- RLS מופעל וכפוי על כל הטבלאות; הרשאות עמודות מינימליות (למשל אי אפשר לשנות `owner_id`).
- אין שום מפתח סודי באפליקציה או ב-Vercel. רק ה-anon key הציבורי. `service_role` ומפתחות RevenueCat הסודיים קיימים רק ב-Edge Functions.
- התשלום מתבצע דרך Apple In-App Purchase; פרטי תשלום לא עוברים אצלך בכלל.
- ה-webhook של RevenueCat מאומת בכותרת סודית, והמצב נקרא מחדש מ-RevenueCat בכל אירוע.
- קישורי הזמנה: טוקן אקראי 192 ביט, נשמר רק ה-hash, תוקף 7 ימים, מוגבל בשימושים, ניתן לביטול.
- סשן המשתמש נשמר ב-Keychain/Keystore (SecureStore) ולא ב-AsyncStorage.
- לוח הניהול: התחברות בקוד למייל + TOTP חובה. בדיקת ההרשאה נעשית בתוך Postgres (`is_admin()` דורש `aal2`).
- כותרות אבטחה (CSP, HSTS, X-Frame-Options, no-referrer) ב-`admin/next.config.ts`.

## התקנה — שלב אחר שלב

### 1. Supabase
1. צרו פרויקט ב-supabase.com.
2. SQL Editor → New query → הדביקו את כל `supabase/schema.sql` → Run.
3. Authentication → Providers: הפעילו **Email** (עם OTP), **Google**, ו-**Apple** (ל-iOS).
4. Authentication → URL Configuration → Redirect URLs, הוסיפו: `focus://auth-callback`
5. Project Settings → API: העתיקו `Project URL` ו-`anon public key`.

### 2. מנוי (Apple In-App Purchase דרך RevenueCat)
1. App Store Connect → Business → Agreements, Tax, and Banking: אשרו את Paid Applications Agreement והזינו בנק ומס.
2. App Store Connect → האפליקציה → Subscriptions: צרו Subscription Group ומוצר חודשי (למשל `focus_monthly`, $1).
3. RevenueCat (revenuecat.com): צרו פרויקט ואפליקציית iOS (bundle id `com.focus.notes`), חברו את App Store Connect (App-Specific Shared Secret / In-App Purchase Key), ייבאו את המוצר.
   - Entitlements → צרו entitlement בשם **`focus_pro`** וצרפו אליו את המוצר.
   - Offerings → ה-offering ה-**current** מכיל package אחד עם המוצר.
4. RevenueCat → Project settings → API keys: העתיקו את ה-**Public iOS SDK key** (`appl_...`) ל-`app/eas.json` תחת `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
5. RevenueCat → Integrations → Webhooks → Add: כתובת `https://<PROJECT_REF>.supabase.co/functions/v1/revenuecat-webhook`, ובשדה Authorization header: `Bearer <סוד-אקראי-ארוך>`.
6. פריסה:
```bash
supabase secrets set REVENUECAT_WEBHOOK_AUTH=<אותו סוד אקראי> REVENUECAT_API_KEY=<Secret API key v1 מ-RevenueCat>
supabase functions deploy revenuecat-webhook delete-account
```
(`SUPABASE_URL` ו-`SUPABASE_SERVICE_ROLE_KEY` מוזרקים אוטומטית לפונקציות.)

המנוי מתחדש חודשית עד שהמשתמש מבטל בהגדרות ה-Apple ID. רכישות עובדות רק ב-build אמיתי (TestFlight / dev build), לא ב-Expo Go.

### 3. האפליקציה
```bash
cd app
cp .env.example .env     # מלאו URL, anon key ודומיין Vercel
npm install
npx expo start           # סריקת QR עם Expo Go (התחברות Apple / בנייה מלאה דורשים dev build)
```
בנייה לחנויות: `npx eas-cli build --platform all`. החליפו את `com.focus.notes` ב-`app/app.json` במזהה שלכם.

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
