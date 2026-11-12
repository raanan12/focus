import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Text } from './ui';
import { avatarColor, radius, space, useTheme } from '../lib/theme';
import { localeFor, useI18n } from '../lib/i18n';
import type { Task } from '../lib/types';

export function TaskRow({ task, showCreator, editing, onToggle, onStartEdit, onCommitEdit, onDelete, onMenu }: {
  task: Task; showCreator: boolean; editing: boolean;
  onToggle: () => void; onStartEdit: () => void; onCommitEdit: (text: string) => void; onDelete: () => void; onMenu: () => void;
}) {
  const th = useTheme(); const { t, lang, rtl } = useI18n();
  const x = useRef(new Animated.Value(0)).current;
  const live = useRef({ onDelete, rtl }); live.current = { onDelete, rtl };
  const [val, setVal] = useState(task.text);
  const committed = useRef(false);
  useEffect(() => { if (editing) { setVal(task.text); committed.current = false; } }, [editing]);
  const commit = () => { if (committed.current) return; committed.current = true; onCommitEdit(val); };

  // swipe sideways (either direction) to delete
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => x.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 110) Animated.timing(x, { toValue: Math.sign(g.dx) * 500, duration: 160, useNativeDriver: true }).start(() => live.current.onDelete());
      else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  })).current;

  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null;
  const overdue = !!due && !task.done && due.getTime() < new Date().setHours(0, 0, 0, 0);
  const dueLabel = due ? due.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' }) : null;

  return (
    <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52, paddingVertical: space.xs }}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.done }} onPress={onToggle} hitSlop={10}
          style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: task.done ? th.text : th.textTertiary,
            backgroundColor: task.done ? th.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {task.done && <Ionicons name="checkmark" size={18} color={th.bg} />}
        </Pressable>
        <View style={{ flex: 1 }}>
          {editing ? (
            <Input autoFocus value={val} onChangeText={setVal} multiline blurOnSubmit returnKeyType="done" maxLength={1000}
              onBlur={commit} onSubmitEditing={commit} style={{ paddingVertical: 0 }} />
          ) : (
            <Pressable onPress={onStartEdit} onLongPress={onMenu} delayLongPress={350} accessibilityLabel={task.text}>
              <Text dim={task.done ? 'tertiary' : undefined} style={task.done ? { textDecorationLine: 'line-through' } : undefined}>{task.text}</Text>
              {dueLabel && (
                <Text variant="caption" style={{ color: overdue ? th.danger : th.textSecondary }}>{t('due')} {dueLabel}</Text>
              )}
            </Pressable>
          )}
        </View>
        {showCreator && task.created_by && (
          <View accessibilityLabel={t('assigned', { name: '' })} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: avatarColor(task.created_by) }} />
        )}
      </View>
    </Animated.View>
  );
}
