import { INVITE_BASE_URL } from './supabase';
import type { Lang } from './i18n';

/** Public privacy policy page (hosted with the website). English version for non-Hebrew users. */
export const privacyUrl = (lang: Lang) => `${INVITE_BASE_URL || 'https://focus-neon-nu.vercel.app'}/privacy${lang === 'he' ? '' : '?lang=en'}`;
