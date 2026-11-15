import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthButtons } from '../components/AuthButtons';
import { Button, Text } from '../components/ui';
import { noteTheme, ThemeContext, radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { store } from '../lib/store';

type Preview = { note_title: string; color: keyof ReturnType<typeof useTheme>['note']; inviter_name: string; tasks: { text: string; done: boolean }[] };

export function JoinScreen({ route, navigation }: { route: any; navigation: any }) {
  const token: string = String(route.params?.token ?? '');
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [preview, setPreview] = useState<Preview | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const wasLoggedOut = useRef(!session);

  useEffect(() => {
    supabase.rpc('get_invite_preview', { p_token: token }).then(({ data }) => setPreview((data as Preview) ?? null));
  }, [token]);

  const join = async () => {
    if (joining) return;
    setJoining(true);
    const { data, error } = await supabase.rpc('accept_invite', { p_token: token });
    if (error || !data) { setJoining(false); Alert.alert(t('invalidInvite')); return; }
    await store.sync();
    navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'Note', params: { noteId: data as string } }] });
  };

  // signed in just now through this screen → join immediately ("enter the note right away")
  useEffect(() => { if (session && wasLoggedOut.current && preview) void join(); }, [session, preview]);

  const bg = preview ? th.note[preview.color] : th.surface;
  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.huge, paddingBottom: insets.bottom + space.xl, gap: space.xl, flexGrow: 1 }}>
        {preview === undefined ? <ActivityIndicator style={{ marginTop: space.huge }} /> : preview === null ? (
          <View style={{ gap: space.lg }}>
            <Text variant="title">{t('invalidInvite')}</Text>
            <Button title={t('ok')} variant="secondary" onPress={() => (session ? navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) : navigation.goBack())} />
          </View>
        ) : (
          <>
            <View style={{ gap: space.xs }}>
              <Text variant="title">{t('joinTitle', { name: preview.inviter_name || '…' })}</Text>
              <Text dim="secondary">{t('joinBody')}</Text>
            </View>
            <ThemeContext.Provider value={noteTheme(th)}>
            <View style={{ backgroundColor: bg, borderRadius: radius.lg, padding: space.xl, gap: space.md }}>
              <Text variant="title">{preview.note_title || t('untitled')}</Text>
              {preview.tasks.map((x, i) => (
                <Text key={i} dim={x.done ? 'tertiary' : 'secondary'} style={x.done ? { textDecorationLine: 'line-through' } : undefined}>• {x.text}</Text>
              ))}
            </View>
            </ThemeContext.Provider>
            <View style={{ flex: 1 }} />
            {session ? <Button title={t('joinButton')} loading={joining} onPress={join} /> : <AuthButtons />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
