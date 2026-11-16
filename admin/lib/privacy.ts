// Privacy policy content. Keep this in sync with what the app and backend really do.
export const CONTACT_EMAIL = 'appfocus9@gmail.com';
export const POLICY_DATE = { he: '17 בנובמבר 2026', en: 'November 17, 2026' };

export type Section = { title: string; body: (string | string[])[] };
type Policy = { title: string; subtitle: string; updated: string; sections: Section[] };

export const policy: { he: Policy; en: Policy } = {
  he: {
    title: 'מדיניות פרטיות',
    subtitle: 'פוקוס (Focus) — אפליקציית פתקים ומשימות משותפים',
    updated: 'עודכן לאחרונה:',
    sections: [
      { title: '1. מי אנחנו ומה המסמך הזה', body: [
        'פוקוס ("האפליקציה", "אנחנו") היא אפליקציה ליצירת פתקים ורשימות משימות ולשיתופם עם אנשים אחרים. מסמך זה מסביר איזה מידע נאסף, איך הוא משמש, עם מי הוא משותף ומה הזכויות שלך.',
        'השימוש באפליקציה מהווה הסכמה למדיניות זו. אם אינך מסכים, אל תשתמש באפליקציה.',
      ] },
      { title: '2. איזה מידע אנחנו אוספים', body: [
        'מידע חשבון: כתובת אימייל ושם תצוגה, כפי שהם מתקבלים מ-Google או מ-Apple בעת ההתחברות. אם בחרת ב-Apple "הסתר את האימייל שלי", נקבל כתובת ממסר (relay) של Apple ולא את כתובתך האמיתית. אנחנו שומרים גם את שיטת ההתחברות, מועד ההרשמה ומועד הכניסה האחרונה.',
        'תוכן שאתה יוצר: פתקים, משימות, תאריכי יעד, צבעים ומצב ביצוע, וכן נתוני שיתוף (מי חבר בפתק ומתי הצטרף).',
        'נתוני שיתוף והזמנות: קוד שיתוף אישי שנוצר לך, וכתובות אימייל שמשתמשים אחרים מזינים כדי להזמין אנשים לפתק. קישורי הזמנה נשמרים בצורה מגובבת (hash) בלבד.',
        'מידע על מנוי: מצב המנוי, תאריך סיום התקופה והאם הוא מתחדש. הרכישה עצמה מתבצעת מול Apple (או Google), ואנחנו אינם מקבלים ואינם שומרים פרטי כרטיס אשראי או אמצעי תשלום.',
        'מידע במכשיר: העדפות (שפה, ערכת צבעים, תזכורות), עותק מקומי של הפתקים לעבודה ללא חיבור, ואסימון התחברות המאוחסן באחסון המאובטח של המכשיר (Keychain / Keystore).',
        'התראות: האפליקציה שולחת תזכורות מקומיות בלבד על תאריכי יעד, שמתוזמנות במכשיר. איננו שולחים התראות Push מהשרת ואיננו אוספים אסימוני Push.',
        'אין באפליקציה פרסומות, מעקב פרסומי או כלי אנליטיקה של צד שלישי, ואיננו אוספים מיקום, אנשי קשר, תמונות או מיקרופון.',
      ] },
      { title: '3. איך אנחנו משתמשים במידע', body: [[
        'להפעלת האפליקציה: התחברות, שמירת הפתקים והמשימות וסנכרונם בין מכשירים.',
        'לאפשר שיתוף פתקים עם משתמשים אחרים לפי בחירתך.',
        'לניהול מנויים וגישה לתכונות בתשלום.',
        'לתפעול, תחזוקה, אבטחה ומניעת שימוש לרעה, ולתמיכה.',
        'לסטטיסטיקות מצטברות על השימוש (למשל מספר משתמשים ופתקים) לצורך שיפור השירות.',
        'לעמידה בדרישות החוק.',
      ]] },
      { title: '4. עם מי המידע משותף', body: [
        'משתמשים אחרים: כשאתה משתף פתק, חברי הפתק רואים את תוכנו, את שמך ואת צבע הזיהוי שלך, ויכולים להוסיף ולערוך משימות בו.',
        'ספקי שירות שמעבדים מידע עבורנו, לפי הצורך להפעלת השירות:',
        [
          'Supabase — אחסון בסיס הנתונים, אימות משתמשים ושרתי אפליקציה. השרתים ממוקמים באזור סידני, אוסטרליה.',
          'Google ו-Apple — התחברות באמצעות חשבון Google / Apple, ועיבוד רכישות ותשלומים (Apple App Store / Google Play).',
          'RevenueCat — ניהול מנויים ואימות רכישות. מקבלת מזהה משתמש ונתוני רכישה.',
          'Vercel — אירוח אתר האפליקציה ועמודי הזמנה.',
        ],
        'איננו מוכרים מידע אישי ואיננו מעבירים אותו לצרכי פרסום. ייתכן שנחשוף מידע אם נידרש לכך על פי דין, צו שיפוטי או בקשה מחייבת של רשות מוסמכת, או כדי להגן על זכויותינו ועל אבטחת המשתמשים.',
      ] },
      { title: '5. העברת מידע בין מדינות', body: [
        'המידע שלך מאוחסן ומעובד בשרתים הנמצאים מחוץ לישראל, ובין השאר באוסטרליה ובארצות הברית, אצל ספקי השירות המפורטים לעיל. השימוש באפליקציה מהווה הסכמה להעברה זו. אנחנו מסתמכים על ההתחייבויות של ספקי השירות להגנה על מידע.',
      ] },
      { title: '6. שמירת מידע ומחיקה', body: [
        'אנחנו שומרים את המידע כל עוד חשבונך פעיל. אתה יכול למחוק את חשבונך בכל עת מתוך האפליקציה: הגדרות ← מחיקת חשבון.',
        'עם המחיקה: חשבונך וכל נתוניו נמחקים. פתקים שיצרת ושהם משותפים עם אחרים מועברים לבעלות אחד השותפים כדי שלא יאבדו להם, ופתקים שאינם משותפים נמחקים. משימות שיצרת בפתקים משותפים נשארות אצל השותפים ללא קישור לחשבונך.',
        'מנוי פעיל אינו מתבטל אוטומטית עם מחיקת החשבון. יש לבטל אותו בהגדרות חשבון ה-Apple / Google שלך. רשומות רכישה אצל Apple, Google ו-RevenueCat כפופות למדיניות שלהן.',
        'ייתכן שגיבויים של ספקי התשתית יישמרו לתקופה מוגבלת לאחר המחיקה.',
      ] },
      { title: '7. אבטחת מידע', body: [
        'אנחנו נוקטים אמצעים סבירים ומקובלים בענף כדי להגן על המידע, ובכלל זה:',
        [
          'הצפנת תעבורה בין האפליקציה לשרתים (HTTPS/TLS).',
          'בקרות גישה ברמת בסיס הנתונים (Row Level Security), כך שכל משתמש יכול לגשת רק לפתקים שהוא חבר בהם.',
          'שמירת אסימון ההתחברות באחסון המאובטח של המכשיר.',
          'שמירת קישורי הזמנה בצורה מגובבת בלבד, ותוקף מוגבל להם.',
          'גישת ניהול מוגבלת למנהלים מורשים, כולל אימות דו-שלבי.',
          'פרטי כרטיס אשראי אינם עוברים דרכנו כלל; התשלום מתבצע מול Apple / Google.',
        ],
        'עם זאת, חשוב לדעת: אין שיטת אחסון או העברת מידע באינטרנט שהיא מאובטחת לחלוטין, ואיננו יכולים להבטיח אבטחה מוחלטת של המידע. למרות מאמצינו, ייתכנו חשיפה, גישה בלתי מורשית, אובדן או שימוש לרעה במידע, כולל כתוצאה מפעולות של צדדים שלישיים, ספקי תשתית, או כשל במכשיר או בחשבון שלך.',
        'תוכן הפתקים והמשימות מאוחסן בבסיס הנתונים ואינו מוצפן מקצה לקצה. לכן אל תשמור באפליקציה מידע רגיש במיוחד, כגון סיסמאות, מספרי כרטיסי אשראי, מספרי זהות או מידע רפואי.',
        'אתה אחראי לשמור על המכשיר שלך, על נעילת המסך ועל חשבונות ה-Google / Apple שלך, ולשתף פתקים רק עם אנשים שאתה סומך עליהם.',
        'אם נגלה אירוע אבטחה שפגע במידע אישי, נפעל בהתאם לדין החל, לרבות מתן הודעה למשתמשים ולרשויות במקרים שבהם הדבר נדרש. עד למידה המותרת בדין, השימוש באפליקציה הוא על אחריותך, ואיננו אחראים לנזקים עקיפים או תוצאתיים הנובעים מאירוע אבטחה שאינו בשליטתנו.',
      ] },
      { title: '8. הזכויות שלך', body: [
        'בכפוף לדין החל, אתה רשאי לבקש לעיין במידע שנשמר עליך, לתקנו או למחוק אותו. אפשר לתקן שם תצוגה ולמחוק את החשבון ישירות באפליקציה, ולכל בקשה אחרת אפשר לפנות אלינו בכתובת שבסעיף 10. נשיב תוך זמן סביר.',
        'אם אתה תושב האיחוד האירופי או אזור אחר שבו חלות הוראות הגנת מידע מקבילות, ייתכן שיש לך זכויות נוספות, כגון הגבלת עיבוד, ניידות מידע והתנגדות, וכן הזכות להגיש תלונה לרשות הגנת הפרטיות המקומית.',
      ] },
      { title: '9. קטינים', body: [
        'האפליקציה אינה מיועדת לילדים מתחת לגיל 13 (או לגיל מבוגר יותר אם הדין במדינתך קובע זאת), ואיננו אוספים ביודעין מידע עליהם. אם נודע לנו על מידע כזה, נמחק אותו. אם אתה סבור שילד נרשם, פנה אלינו.',
      ] },
      { title: '10. יצירת קשר', body: [
        'לשאלות, לבקשות הנוגעות למידע האישי שלך או לדיווח על בעיית אבטחה:',
      ] },
      { title: '11. שינויים במדיניות', body: [
        'ייתכן שנעדכן מדיניות זו מעת לעת. נציין בראש המסמך את תאריך העדכון האחרון, ובשינויים מהותיים נפרסם הודעה באפליקציה או באתר. המשך השימוש לאחר עדכון מהווה הסכמה לגרסה המעודכנת.',
      ] },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'Focus — shared notes and tasks app',
    updated: 'Last updated:',
    sections: [
      { title: '1. Who we are and what this document is', body: [
        'Focus ("the app", "we") lets you create notes and task lists and share them with other people. This policy explains what information we collect, how we use it, who it is shared with, and your rights.',
        'By using the app you agree to this policy. If you do not agree, please do not use the app.',
      ] },
      { title: '2. Information we collect', body: [
        'Account information: your e-mail address and display name, as provided by Google or Apple when you sign in. If you choose Apple\'s "Hide My Email", we receive an Apple private-relay address instead of your real address. We also store the sign-in method, the sign-up date and your last sign-in date.',
        'Content you create: notes, tasks, due dates, colors and completion status, plus sharing data (who is a member of a note and when they joined).',
        'Sharing and invitations: a personal share code generated for you, and e-mail addresses that other users enter to invite people to a note. Invitation links are stored only as a hash.',
        'Subscription information: subscription status, period end date and whether it renews. The purchase itself is handled by Apple (or Google); we do not receive or store card details or payment methods.',
        'On your device: preferences (language, theme, reminders), a local copy of your notes for offline use, and a sign-in token kept in the device\'s secure storage (Keychain / Keystore).',
        'Notifications: the app only sends local due-date reminders, scheduled on your device. We do not send server push notifications and do not collect push tokens.',
        'The app contains no advertising, no ad tracking and no third-party analytics. We do not collect your location, contacts, photos or microphone.',
      ] },
      { title: '3. How we use information', body: [[
        'To run the app: sign-in, storing your notes and tasks, and syncing them across devices.',
        'To let you share notes with other users of your choice.',
        'To manage subscriptions and access to paid features.',
        'To operate, maintain and secure the service, prevent abuse, and provide support.',
        'To produce aggregate usage statistics (for example the number of users and notes) to improve the service.',
        'To comply with legal obligations.',
      ]] },
      { title: '4. Who we share information with', body: [
        'Other users: when you share a note, its members can see its content, your name and your identification color, and can add and edit tasks in it.',
        'Service providers that process data on our behalf, as needed to run the service:',
        [
          'Supabase — database hosting, user authentication and backend. Servers are located in the Sydney, Australia region.',
          'Google and Apple — sign-in with a Google / Apple account, and processing of purchases and payments (Apple App Store / Google Play).',
          'RevenueCat — subscription management and purchase validation. It receives a user identifier and purchase data.',
          'Vercel — hosting of the app\'s website and invitation pages.',
        ],
        'We do not sell personal information and do not share it for advertising. We may disclose information if required by law, a court order or a binding request from a competent authority, or to protect our rights and the safety of users.',
      ] },
      { title: '5. International transfers', body: [
        'Your information is stored and processed on servers outside Israel, including in Australia and the United States, by the service providers listed above. By using the app you consent to this transfer. We rely on our providers\' commitments to protect data.',
      ] },
      { title: '6. Retention and deletion', body: [
        'We keep your information while your account is active. You can delete your account at any time inside the app: Settings → Delete account.',
        'On deletion, your account and its data are deleted. Notes you created that are shared with others are handed over to one of the other members so they are not lost, and notes that are not shared are deleted. Tasks you created in shared notes remain for the other members without any link to your account.',
        'An active subscription is not cancelled automatically when you delete your account. Cancel it in your Apple / Google account settings. Purchase records held by Apple, Google and RevenueCat are subject to their own policies.',
        'Backups held by our infrastructure providers may persist for a limited time after deletion.',
      ] },
      { title: '7. Information security', body: [
        'We take reasonable, industry-standard measures to protect information, including:',
        [
          'Encryption of traffic between the app and our servers (HTTPS/TLS).',
          'Database-level access controls (Row Level Security), so each user can only access notes they are a member of.',
          'Storing the sign-in token in the device\'s secure storage.',
          'Storing invitation links only as hashes, with limited validity.',
          'Administrative access limited to authorized administrators, protected by two-factor authentication.',
          'Payment card details never pass through us; payment is handled by Apple / Google.',
        ],
        'However, please understand: no method of storing or transmitting data on the internet is completely secure, and we cannot guarantee absolute security. Despite our efforts, information may be exposed, accessed without authorization, lost or misused, including as a result of the actions of third parties, infrastructure providers, or a failure of your own device or account.',
        'The content of notes and tasks is stored in the database and is not end-to-end encrypted. Therefore, please do not store highly sensitive information in the app, such as passwords, payment card numbers, ID numbers or medical information.',
        'You are responsible for securing your device, its screen lock and your Google / Apple accounts, and for sharing notes only with people you trust.',
        'If we become aware of a security incident that affects personal information, we will act in accordance with applicable law, including notifying users and authorities where required. To the extent permitted by law, you use the app at your own risk, and we are not liable for indirect or consequential damages arising from a security incident outside our control.',
      ] },
      { title: '8. Your rights', body: [
        'Subject to applicable law, you may ask to access, correct or delete the information we hold about you. You can edit your display name and delete your account directly in the app; for any other request contact us at the address in section 10. We will respond within a reasonable time.',
        'If you are in the European Union or another region with equivalent data-protection law, you may have additional rights, such as restriction of processing, data portability and objection, and the right to lodge a complaint with your local data-protection authority.',
      ] },
      { title: '9. Children', body: [
        'The app is not intended for children under 13 (or a higher age where your country\'s law requires), and we do not knowingly collect their information. If we learn that we have, we will delete it. If you believe a child has registered, please contact us.',
      ] },
      { title: '10. Contact', body: [
        'For questions, requests about your personal information, or to report a security issue:',
      ] },
      { title: '11. Changes to this policy', body: [
        'We may update this policy from time to time. The date of the latest update appears at the top, and for material changes we will post a notice in the app or on the website. Continued use after an update means you accept the updated version.',
      ] },
    ],
  },
};
