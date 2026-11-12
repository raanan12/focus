import { createContext, useContext } from 'react';

export type Lang = 'he' | 'en' | 'ar';
export const RTL_LANGS: Lang[] = ['he', 'ar'];

type Dict = Record<string, string>;

const en: Dict = {
  appName: 'Duo',
  tagline: 'One list. Many partners.',
  signInGoogle: 'Continue with Google', signInApple: 'Continue with Apple', or: 'or',
  email: 'Email address', sendCode: 'Send me a code', codeSent: 'We sent a 6-digit code to {email}',
  code: '6-digit code', verify: 'Verify', back: 'Back',
  newNote: 'New note', untitled: 'Untitled', searchPlaceholder: 'Search notes and tasks',
  progress: '{done} of {total}', emptyTitle: 'Your first note is waiting', emptyBody: 'Tap + to create a note, add tasks and share it in 30 seconds.',
  sampleTitle: 'Groceries 🛒', sampleTasks: 'Milk|Bread|Tomatoes|Coffee',
  addTask: 'Add a task…', clearDone: 'Clear completed', due: 'Due', today: 'Today', tomorrow: 'Tomorrow', pickDate: 'Pick a date', noDate: 'No date',
  moveUp: 'Move up', moveDown: 'Move down', undo: 'Undo', taskDeleted: 'Task deleted',
  changeColor: 'Change color', share: 'Share', delete: 'Delete', cancel: 'Cancel', duplicate: 'Duplicate', exportText: 'Export as text',
  moveFirst: 'Move to front', leaveNote: 'Leave note',
  deleteNoteQ: 'Delete this note?', deleteNoteBody: 'This removes it for everyone.', leaveQ: 'Leave this note?',
  shareTitle: 'Share note', copyLink: 'Copy link', linkCopied: 'Link copied ✓', whatsapp: 'WhatsApp', emailInvite: 'Email',
  inviteValid: 'The link works for 7 days and up to 5 people.', partners: 'Partners', owner: 'Owner', pendingJoin: 'Waiting to join',
  remove: 'Remove', revoke: 'Cancel invite',
  inviteText: '{name} invited you to the note "{title}" on Duo: {link}',
  inviteSubject: 'Join my note on Duo',
  joinTitle: '{name} invited you', joinBody: 'to join the note', joinButton: 'Join note', invalidInvite: 'This invite is no longer valid.',
  settings: 'Settings', language: 'Language', notifications: 'Reminders & share alerts', appearance: 'Appearance',
  auto: 'Automatic', light: 'Light', dark: 'Dark', subscription: 'Subscription', exportData: 'Export all my data', signOut: 'Sign out',
  deleteAccount: 'Delete account', deleteAccountBody: 'This permanently deletes your account. Shared notes are handed to your partners. This cannot be undone.',
  deleteAccountConfirm: 'Yes, delete everything', typeDelete: 'Type DELETE to confirm',
  planTrial: 'Free trial · {days} days left', planActive: 'Active · renews {date}', planEnding: 'Ends {date}', planNone: 'No active plan',
  subscribe: 'Subscribe · $1 / month', cancelSub: 'Cancel subscription', cancelSubQ: 'Cancel your subscription?', cancelSubBody: 'You keep access until the end of the paid period.',
  priceLine: '$1 per month for 12 months. Cancel any time.', paywallTitle: 'Keep creating notes', paywallBody: 'Your free trial ended. Subscribe to create and share new notes. Partners you invite never pay.',
  securePayment: 'Secure payment by Stripe — card details never reach us.',
  offline: 'Offline — changes will sync', syncing: 'Syncing…', error: 'Something went wrong', retry: 'Try again', ok: 'OK',
  assigned: 'Added by {name}', you: 'You',
};

const he: Dict = {
  appName: 'Duo',
  tagline: 'רשימה אחת. שותפים מרובים.',
  signInGoogle: 'המשך עם Google', signInApple: 'המשך עם Apple', or: 'או',
  email: 'כתובת מייל', sendCode: 'שלחו לי קוד', codeSent: 'שלחנו קוד בן 6 ספרות אל {email}',
  code: 'קוד בן 6 ספרות', verify: 'אימות', back: 'חזרה',
  newNote: 'פתק חדש', untitled: 'ללא כותרת', searchPlaceholder: 'חיפוש בפתקים ובמשימות',
  progress: '{done} מתוך {total}', emptyTitle: 'הפתק הראשון שלך מחכה', emptyBody: 'לחצו על + כדי ליצור פתק, להוסיף משימות ולשתף תוך 30 שניות.',
  sampleTitle: 'קניות 🛒', sampleTasks: 'חלב|לחם|עגבניות|קפה',
  addTask: 'הוסף משימה…', clearDone: 'נקה משימות שבוצעו', due: 'יעד', today: 'היום', tomorrow: 'מחר', pickDate: 'בחר תאריך', noDate: 'ללא תאריך',
  moveUp: 'הזז למעלה', moveDown: 'הזז למטה', undo: 'בטל', taskDeleted: 'המשימה נמחקה',
  changeColor: 'שינוי צבע', share: 'שיתוף', delete: 'מחיקה', cancel: 'ביטול', duplicate: 'שכפול פתק', exportText: 'ייצוא כטקסט',
  moveFirst: 'העבר להתחלה', leaveNote: 'יציאה מהפתק',
  deleteNoteQ: 'למחוק את הפתק?', deleteNoteBody: 'הפתק יימחק עבור כל השותפים.', leaveQ: 'לצאת מהפתק?',
  shareTitle: 'שיתוף פתק', copyLink: 'העתק קישור', linkCopied: 'הקישור הועתק ✓', whatsapp: 'וואטסאפ', emailInvite: 'מייל',
  inviteValid: 'הקישור תקף ל-7 ימים ועד 5 שותפים.', partners: 'שותפים', owner: 'בעלים', pendingJoin: 'ממתין להצטרפות',
  remove: 'הסר', revoke: 'בטל הזמנה',
  inviteText: '{name} שיתף איתך את "{title}" ב-Duo: {link}',
  inviteSubject: 'הצטרפו לפתק שלי ב-Duo',
  joinTitle: '{name} הזמין אותך', joinBody: 'להצטרף לפתק', joinButton: 'הצטרף לפתק', invalidInvite: 'ההזמנה אינה תקפה יותר.',
  settings: 'הגדרות', language: 'שפה', notifications: 'תזכורות והתראות שיתוף', appearance: 'ערכת צבעים',
  auto: 'אוטומטי', light: 'בהיר', dark: 'כהה', subscription: 'מנוי', exportData: 'ייצוא כל הנתונים שלי', signOut: 'התנתקות',
  deleteAccount: 'מחיקת חשבון', deleteAccountBody: 'החשבון יימחק לצמיתות. פתקים משותפים יועברו לשותפים שלך. לא ניתן לבטל.',
  deleteAccountConfirm: 'כן, מחק הכול', typeDelete: 'הקלידו DELETE לאישור',
  planTrial: 'תקופת ניסיון · נותרו {days} ימים', planActive: 'פעיל · מתחדש ב-{date}', planEnding: 'מסתיים ב-{date}', planNone: 'אין מנוי פעיל',
  subscribe: 'הרשמה · $1 לחודש', cancelSub: 'ביטול מנוי', cancelSubQ: 'לבטל את המנוי?', cancelSubBody: 'הגישה נשמרת עד סוף התקופה ששולמה.',
  priceLine: '$1 לחודש למשך 12 חודשים. אפשר לבטל בכל עת.', paywallTitle: 'ממשיכים ליצור פתקים', paywallBody: 'תקופת הניסיון הסתיימה. הירשמו כדי ליצור ולשתף פתקים חדשים. שותפים שמוזמנים לא משלמים.',
  securePayment: 'תשלום מאובטח באמצעות Stripe — פרטי האשראי לא עוברים אלינו.',
  offline: 'אין חיבור — השינויים יסונכרנו', syncing: 'מסנכרן…', error: 'משהו השתבש', retry: 'נסו שוב', ok: 'אישור',
  assigned: 'נוסף ע"י {name}', you: 'אני',
};

const ar: Dict = {
  appName: 'Duo',
  tagline: 'قائمة واحدة. شركاء متعددون.',
  signInGoogle: 'المتابعة عبر Google', signInApple: 'المتابعة عبر Apple', or: 'أو',
  email: 'البريد الإلكتروني', sendCode: 'أرسل لي رمزًا', codeSent: 'أرسلنا رمزًا من 6 أرقام إلى {email}',
  code: 'رمز من 6 أرقام', verify: 'تأكيد', back: 'رجوع',
  newNote: 'ملاحظة جديدة', untitled: 'بدون عنوان', searchPlaceholder: 'ابحث في الملاحظات والمهام',
  progress: '{done} من {total}', emptyTitle: 'ملاحظتك الأولى بانتظارك', emptyBody: 'اضغط + لإنشاء ملاحظة وإضافة مهام ومشاركتها خلال 30 ثانية.',
  sampleTitle: 'مشتريات 🛒', sampleTasks: 'حليب|خبز|طماطم|قهوة',
  addTask: 'أضف مهمة…', clearDone: 'مسح المهام المنجزة', due: 'الموعد', today: 'اليوم', tomorrow: 'غدًا', pickDate: 'اختر تاريخًا', noDate: 'بدون تاريخ',
  moveUp: 'نقل للأعلى', moveDown: 'نقل للأسفل', undo: 'تراجع', taskDeleted: 'تم حذف المهمة',
  changeColor: 'تغيير اللون', share: 'مشاركة', delete: 'حذف', cancel: 'إلغاء', duplicate: 'تكرار الملاحظة', exportText: 'تصدير كنص',
  moveFirst: 'نقل إلى البداية', leaveNote: 'مغادرة الملاحظة',
  deleteNoteQ: 'حذف هذه الملاحظة؟', deleteNoteBody: 'سيتم حذفها لدى جميع الشركاء.', leaveQ: 'مغادرة هذه الملاحظة؟',
  shareTitle: 'مشاركة الملاحظة', copyLink: 'نسخ الرابط', linkCopied: 'تم نسخ الرابط ✓', whatsapp: 'واتساب', emailInvite: 'البريد',
  inviteValid: 'الرابط صالح لمدة 7 أيام ولحتى 5 أشخاص.', partners: 'الشركاء', owner: 'المالك', pendingJoin: 'بانتظار الانضمام',
  remove: 'إزالة', revoke: 'إلغاء الدعوة',
  inviteText: 'شارك {name} معك الملاحظة "{title}" على Duo: {link}',
  inviteSubject: 'انضم إلى ملاحظتي على Duo',
  joinTitle: 'دعاك {name}', joinBody: 'للانضمام إلى الملاحظة', joinButton: 'انضم إلى الملاحظة', invalidInvite: 'هذه الدعوة لم تعد صالحة.',
  settings: 'الإعدادات', language: 'اللغة', notifications: 'التذكيرات وإشعارات المشاركة', appearance: 'المظهر',
  auto: 'تلقائي', light: 'فاتح', dark: 'داكن', subscription: 'الاشتراك', exportData: 'تصدير كل بياناتي', signOut: 'تسجيل الخروج',
  deleteAccount: 'حذف الحساب', deleteAccountBody: 'سيتم حذف حسابك نهائيًا. تُنقل الملاحظات المشتركة إلى شركائك. لا يمكن التراجع.',
  deleteAccountConfirm: 'نعم، احذف كل شيء', typeDelete: 'اكتب DELETE للتأكيد',
  planTrial: 'فترة تجريبية · متبقي {days} يومًا', planActive: 'نشط · يتجدد في {date}', planEnding: 'ينتهي في {date}', planNone: 'لا يوجد اشتراك نشط',
  subscribe: 'اشترك · $1 شهريًا', cancelSub: 'إلغاء الاشتراك', cancelSubQ: 'إلغاء اشتراكك؟', cancelSubBody: 'تحتفظ بالوصول حتى نهاية الفترة المدفوعة.',
  priceLine: '$1 شهريًا لمدة 12 شهرًا. يمكنك الإلغاء في أي وقت.', paywallTitle: 'تابع إنشاء الملاحظات', paywallBody: 'انتهت الفترة التجريبية. اشترك لإنشاء ومشاركة ملاحظات جديدة. الشركاء المدعوون لا يدفعون.',
  securePayment: 'دفع آمن عبر Stripe — بيانات البطاقة لا تصل إلينا.',
  offline: 'غير متصل — ستتم المزامنة لاحقًا', syncing: 'جارٍ المزامنة…', error: 'حدث خطأ ما', retry: 'حاول مجددًا', ok: 'حسنًا',
  assigned: 'أضافها {name}', you: 'أنا',
};

const dicts: Record<Lang, Dict> = { en, he, ar };

export type I18n = {
  lang: Lang;
  rtl: boolean;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export function makeT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => {
    let s = dicts[lang][key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

export const I18nContext = createContext<I18n>({ lang: 'en', rtl: false, setLang: () => {}, t: makeT('en') });
export const useI18n = () => useContext(I18nContext);

export const localeFor = (lang: Lang) => (lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar' : 'en-US');
