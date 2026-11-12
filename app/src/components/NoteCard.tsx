import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, AvatarStack } from './ui';
import { radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import type { Member, Note, Task } from '../lib/types';

export function NoteCard({ note, tasks, members, unread, onPress, onLongPress, width }:
  { note: Note; tasks: Task[]; members: Member[]; unread: boolean; onPress: () => void; onLongPress: () => void; width: number }) {
  const th = useTheme(); const { t } = useI18n();
  const open = tasks.filter((x) => !x.done);
  const done = tasks.length - open.length;
  const bg = th.note[note.color];
  const shared = members.length > 1;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350} accessibilityRole="button"
      accessibilityLabel={note.title || t('untitled')}
      style={({ pressed }) => ({ width, minHeight: 168, backgroundColor: bg, borderRadius: radius.lg, padding: space.lg,
        gap: space.sm, opacity: pressed ? 0.85 : 1, shadowColor: bg, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
        <Text strong numberOfLines={2} style={{ flex: 1, color: th.text }}>{note.title || t('untitled')}</Text>
        {unread && <View accessibilityLabel="updated" style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: th.accent, marginTop: 6 }} />}
      </View>
      <View style={{ gap: space.xs, flex: 1 }}>
        {open.slice(0, 3).map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={{ width: 12, height: 12, borderRadius: 4, borderWidth: 1.5, borderColor: th.textTertiary }} />
            <Text variant="caption" dim="secondary" numberOfLines={1} style={{ flex: 1 }}>{x.text}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" dim="tertiary">{tasks.length ? t('progress', { done, total: tasks.length }) : ' '}</Text>
        {shared && <AvatarStack people={members.map((m) => ({ id: m.user_id, name: m.display_name }))} ring={bg} />}
      </View>
    </Pressable>
  );
}
