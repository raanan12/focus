import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { NoteCard } from '../components/NoteCard';
import { Input, MenuRow, Sheet, Text, IconButton } from '../components/ui';
import { NOTE_COLORS, radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { store, useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { useAccess } from '../lib/access';
import { usePrefs } from '../lib/prefs';
import { syncReminders } from '../lib/reminders';
import type { Note } from '../lib/types';

export function HomeScreen({ navigation }: { navigation: any }) {
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  const { session } = useAuth(); const me = session!.user.id;
  const { reminders } = usePrefs();
  const { access, refresh: refreshAccess } = useAccess();
  const { width } = useWindowDimensions();
  const s = useStore((x) => x);
  const [query, setQuery] = useState(''); const [searching, setSearching] = useState(false);
  const [menuNote, setMenuNote] = useState<Note | null>(null);

  const cols = width < 600 ? 2 : width < 900 ? 3 : 4;
  const gap = space.md; const pad = space.lg;
  const cardW = Math.floor((width - pad * 2 - gap * (cols - 1)) / cols);

  const myPos = (id: string) => s.members[id]?.find((m) => m.user_id === me)?.position ?? 0;
  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(s.notes)
      .filter((n) => !q || n.title.toLowerCase().includes(q) || (s.tasks[n.id] ?? []).some((x) => x.text.toLowerCase().includes(q)))
      .sort((a, b) => myPos(a.id) - myPos(b.id));
  }, [s.notes, s.tasks, s.members, query]);

  // first run: friendly sample note (deletable)
  useEffect(() => {
    if (!s.ready || !s.online || s.syncing || Object.keys(s.notes).length > 0) return;
    const flag = `duo:sample:${me}`;
    AsyncStorage.getItem(flag).then(async (v) => {
      if (v || Object.keys(store.state.notes).length > 0) return;
      await AsyncStorage.setItem(flag, '1');
      const id = store.createNote({ title: t('sampleTitle'), color: 'yellow' });
      store.addTasks(id, t('sampleTasks').split('|'));
    });
  }, [s.ready, s.online, s.syncing, s.notes]);

  // local due-date reminders
  useEffect(() => { void syncReminders(Object.values(s.tasks).flat(), reminders, t('today')); }, [s.tasks, reminders]);

  const create = () => {
    if (access && !access.has_access) { navigation.navigate('Paywall'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = store.createNote();
    navigation.navigate('Note', { noteId: id, focusTitle: true });
  };

  const unread = (n: Note) => {
    const m = s.members[n.id]?.find((x) => x.user_id === me);
    return !!m && !!n.updated_by && n.updated_by !== me && Date.parse(n.updated_at) > Date.parse(m.last_seen_at);
  };

  const confirmDelete = (n: Note) => {
    const owner = n.owner_id === me;
    Alert.alert(owner ? t('deleteNoteQ') : t('leaveQ'), owner ? t('deleteNoteBody') : undefined, [
      { text: t('cancel'), style: 'cancel' },
      { text: owner ? t('delete') : t('leaveNote'), style: 'destructive', onPress: () => (owner ? store.deleteNote(n.id) : store.leaveNote(n.id)) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: pad, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="hero">{t('appName')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(s.pending > 0 || !s.online) && (
            <View accessibilityLabel={t('offline')} style={{ paddingHorizontal: space.sm }}>
              <Ionicons name={s.online ? 'cloud-upload-outline' : 'cloud-offline-outline'} size={22} color={th.textSecondary} />
            </View>
          )}
          <IconButton name="settings-outline" label={t('settings')} onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>

      {searching && (
        <View style={{ marginHorizontal: pad, marginTop: space.sm, backgroundColor: th.surface, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
          <Ionicons name="search" size={18} color={th.textTertiary} />
          <Input autoFocus value={query} onChangeText={setQuery} placeholder={t('searchPlaceholder')} style={{ flex: 1, paddingVertical: space.md }} />
          <Pressable onPress={() => { setQuery(''); setSearching(false); }} accessibilityLabel={t('cancel')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={th.textTertiary} />
          </Pressable>
        </View>
      )}

      <FlatList
        key={cols} numColumns={cols} data={notes} keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: pad, paddingBottom: 140, gap }}
        columnWrapperStyle={cols > 1 ? { gap } : undefined}
        refreshControl={<RefreshControl refreshing={false} tintColor={th.textTertiary}
          onRefresh={() => { setSearching(true); void store.sync(); void refreshAccess(); }} />}
        renderItem={({ item }) => (
          <NoteCard note={item} width={cardW} tasks={s.tasks[item.id] ?? []} members={s.members[item.id] ?? []} unread={unread(item)}
            onPress={() => navigation.navigate('Note', { noteId: item.id })}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMenuNote(item); }} />
        )}
        ListEmptyComponent={s.ready || !s.online ? (
          <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.huge * 2 }}>
            <Text style={{ fontSize: 56, lineHeight: 72 }}>📝</Text>
            <Text variant="title">{t('emptyTitle')}</Text>
            <Text dim="secondary" style={{ textAlign: 'center' }}>{t('emptyBody')}</Text>
          </View>
        ) : undefined}
      />

      {/* The black round + button: fixed in the same spot (thumb zone) */}
      <Pressable accessibilityRole="button" accessibilityLabel={t('newNote')} onPress={create}
        style={({ pressed }) => ({ position: 'absolute', end: space.xl, bottom: insets.bottom + space.xl, width: 64, height: 64, borderRadius: 32,
          backgroundColor: th.primary, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }],
          shadowColor: th.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 })}>
        <Ionicons name="add" size={32} color={th.onPrimary} />
      </Pressable>

      <Sheet visible={!!menuNote} onClose={() => setMenuNote(null)} title={menuNote?.title || t('untitled')}>
        {menuNote && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {NOTE_COLORS.map((c) => (
                <Pressable key={c} accessibilityLabel={c} onPress={() => { store.updateNote(menuNote.id, { color: c }); setMenuNote(null); }}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.note[c], borderWidth: menuNote.color === c ? 2 : 0, borderColor: th.text }} />
              ))}
            </View>
            <MenuRow icon="person-add-outline" label={t('share')} onPress={() => { const id = menuNote.id; setMenuNote(null); navigation.navigate('Note', { noteId: id, openShare: true }); }} />
            <MenuRow icon="arrow-up-circle-outline" label={t('moveFirst')} onPress={() => { store.moveNoteToFront(menuNote.id); setMenuNote(null); }} />
            <MenuRow icon="trash-outline" danger label={menuNote.owner_id === me ? t('delete') : t('leaveNote')} onPress={() => { const n = menuNote; setMenuNote(null); confirmDelete(n); }} />
          </>
        )}
      </Sheet>
    </View>
  );
}
