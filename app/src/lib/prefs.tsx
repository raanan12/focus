import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nContext, Lang, RTL_LANGS, makeT } from './i18n';
import { ThemeContext, resolveTheme } from './theme';
import { supabase } from './supabase';

export type ThemePref = 'auto' | 'light' | 'dark';
type Prefs = { themePref: ThemePref; setThemePref: (p: ThemePref) => void; reminders: boolean; setReminders: (v: boolean) => void };
const PrefsContext = createContext<Prefs>(null as unknown as Prefs);
export const usePrefs = () => useContext(PrefsContext);

// The layout direction is applied per-root-view (style.direction), so switching language
// flips the whole UI instantly with no app restart.
I18nManager.allowRTL(false);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [lang, setLangState] = useState<Lang>(() => {
    const code = Localization.getLocales()[0]?.languageCode;
    return code === 'he' || code === 'iw' ? 'he' : code === 'ar' ? 'ar' : 'en';
  });
  const [themePref, setThemePrefState] = useState<ThemePref>('auto');
  const [reminders, setRemindersState] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['duo:lang', 'duo:theme', 'duo:reminders']).then(([l, t, r]) => {
      if (l[1] === 'he' || l[1] === 'en' || l[1] === 'ar') setLangState(l[1]);
      if (t[1] === 'auto' || t[1] === 'light' || t[1] === 'dark') setThemePrefState(t[1]);
      if (r[1] !== null) setRemindersState(r[1] === '1');
    });
  }, []);

  const syncProfile = useCallback(async (patch: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) await supabase.from('profiles').update(patch).eq('id', data.session.user.id);
  }, []);

  const setLang = useCallback((l: Lang) => { setLangState(l); void AsyncStorage.setItem('duo:lang', l); void syncProfile({ language: l }); }, [syncProfile]);
  const setThemePref = useCallback((p: ThemePref) => { setThemePrefState(p); void AsyncStorage.setItem('duo:theme', p); void syncProfile({ theme: p }); }, [syncProfile]);
  const setReminders = useCallback((v: boolean) => { setRemindersState(v); void AsyncStorage.setItem('duo:reminders', v ? '1' : '0'); void syncProfile({ notify_due: v }); }, [syncProfile]);

  const i18n = useMemo(() => ({ lang, rtl: RTL_LANGS.includes(lang), setLang, t: makeT(lang) }), [lang, setLang]);
  const theme = resolveTheme(themePref, system);
  const prefs = useMemo(() => ({ themePref, setThemePref, reminders, setReminders }), [themePref, setThemePref, reminders, setReminders]);

  return (
    <PrefsContext.Provider value={prefs}>
      <I18nContext.Provider value={i18n}>
        <ThemeContext.Provider value={theme}>
          <View style={{ flex: 1, direction: i18n.rtl ? 'rtl' : 'ltr', backgroundColor: theme.bg }}>{children}</View>
        </ThemeContext.Provider>
      </I18nContext.Provider>
    </PrefsContext.Provider>
  );
}
