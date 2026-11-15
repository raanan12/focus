import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Button, IconButton, Input, Sheet, Text } from '../components/ui';
import { radius, space, useTheme } from '../lib/theme';
import { Lang, localeFor, useI18n } from '../lib/i18n';
import { usePrefs } from '../lib/prefs';
import { useAuth } from '../lib/auth';
import { useAccess } from '../lib/access';
import { store } from '../lib/store';
import { supabase } from '../lib/supabase';
import { manageSubscriptions } from '../lib/purchases';
import * as Clipboard from 'expo-clipboard';
import { askNotificationPermission } from '../lib/reminders';

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: th.surface, borderRadius: radius.pill, padding: 4 }}>
      {options.map((o) => (
        <Pressable key={o.v} onPress={() => onChange(o.v)} accessibilityRole="button" style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center',
          borderRadius: radius.pill, backgroundColor: value === o.v ? th.bg : 'transparent' }}>
          <Text variant="caption" strong={value === o.v}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ gap: space.md }}><Text variant="caption" dim="tertiary" strong>{title}</Text>{children}</View>
);

export function SettingsScreen({ navigation }: { navigation: any }) {
  const th = useTheme(); const { t, lang, setLang, rtl } = useI18n(); const insets = useSafeAreaInsets();
  const { themePref, setThemePref, reminders, setReminders } = usePrefs();
  const { session, signOut } = useAuth();
  const { access, refresh } = useAccess();
  const [delOpen, setDelOpen] = useState(false); const [confirmText, setConfirmText] = useState(''); const [busy, setBusy] = useState(false);

  const [shareCode, setShareCode] = useState<string | null>(null); const [codeCopied, setCodeCopied] = useState(false);
  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('share_code').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setShareCode((data as { share_code?: string } | null)?.share_code ?? null));
  }, [session?.user.id]);
  const prettyCode = shareCode ? `${shareCode.slice(0, 4)}-${shareCode.slice(4)}` : '…';
  const copyCode = async () => { if (!shareCode) return; await Clipboard.setStringAsync(prettyCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2200); };

  useFocusEffect(React.useCallback(() => { void refresh(); }, [refresh]));

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const subscribed = access?.status === 'active' || access?.status === 'trialing';
  const planLine = !access ? '…'
    : subscribed ? (access.cancel_at_period_end || access.cancel_at ? t('planEnding', { date: fmt(access.cancel_at ?? access.current_period_end) }) : t('planActive', { date: fmt(access.current_period_end) }))
    : access.has_access ? t('planTrial', { days: Math.max(0, Math.ceil((Date.parse(access.trial_ends_at!) - Date.now()) / 86400000)) })
    : t('planNone');


  const deleteAccount = async () => {
    setBusy(true);
    const uid = session!.user.id;
    const { error } = await supabase.functions.invoke('delete-account');
    setBusy(false);
    if (error) { Alert.alert(t('error')); return; }
    setDelOpen(false);
    await store.clearLocal(uid);
    await supabase.auth.signOut({ scope: 'local' });
  };

  const toggleReminders = async (v: boolean) => { if (v && !(await askNotificationPermission())) return; setReminders(v); };

  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: space.sm, flexDirection: 'row', alignItems: 'center' }}>
        <IconButton name={rtl ? 'chevron-forward' : 'chevron-back'} label={t('back')} onPress={() => navigation.goBack()} />
        <Text variant="title">{t('settings')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xxl, paddingBottom: insets.bottom + space.huge }}>
        <Text dim="secondary">{session?.user.email}</Text>

        <Section title={t('myShareCode')}>
          <Pressable onPress={copyCode} accessibilityRole="button" accessibilityLabel={t('myShareCode')}
            style={{ backgroundColor: th.surface, borderRadius: radius.md, padding: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: '800', letterSpacing: 3 }}>{prettyCode}</Text>
            {codeCopied ? <Text variant="caption" dim="secondary">{t('codeCopied')}</Text> : <Ionicons name="copy-outline" size={22} color={th.textSecondary} />}
          </Pressable>
          <Text variant="caption" dim="tertiary">{t('shareCodeHint')}</Text>
        </Section>

        <Section title={t('language')}>
          <Segmented<Lang> value={lang} onChange={setLang} options={[{ v: 'he', label: 'עברית' }, { v: 'en', label: 'English' }, { v: 'ar', label: 'العربية' }]} />
        </Section>
        <Section title={t('appearance')}>
          <Segmented value={themePref} onChange={setThemePref} options={[{ v: 'auto', label: t('auto') }, { v: 'light', label: t('light') }, { v: 'dark', label: t('dark') }]} />
        </Section>
        <Section title={t('notifications')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text>{t('notifications')}</Text>
            <Switch value={reminders} onValueChange={toggleReminders} />
          </View>
        </Section>
        <Section title={t('subscription')}>
          <Text>{planLine}</Text>
          {subscribed
            ? <Button variant="secondary" title={t('cancelSub')} onPress={() => { void manageSubscriptions().catch(() => Linking.openURL('https://apps.apple.com/account/subscriptions')); }} />
            : <Button title={t('subscribe')} onPress={() => navigation.navigate('Paywall')} />}
        </Section>
        <Section title=" ">
          <Button variant="secondary" icon="log-out-outline" title={t('signOut')} onPress={() => signOut()} />
          <Button variant="ghost" title={t('deleteAccount')} onPress={() => { setConfirmText(''); setDelOpen(true); }} style={{ }} />
        </Section>
      </ScrollView>

      <Sheet visible={delOpen} onClose={() => setDelOpen(false)} title={t('deleteAccount')}>
        <Text dim="secondary">{t('deleteAccountBody')}</Text>
        <Input value={confirmText} onChangeText={setConfirmText} placeholder={t('typeDelete')} autoCapitalize="characters" autoCorrect={false}
          style={{ backgroundColor: th.surface, borderRadius: radius.md, padding: space.lg }} />
        <Button variant="danger" title={t('deleteAccountConfirm')} loading={busy} disabled={confirmText.trim() !== 'DELETE'} onPress={deleteAccount} />
      </Sheet>
    </View>
  );
}
