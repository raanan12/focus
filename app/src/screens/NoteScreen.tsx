import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { AvatarStack, Button, IconButton, Input, MenuRow, Sheet, Text } from '../components/ui';
import { TaskRow } from '../components/TaskRow';
import { ShareSheet } from '../components/ShareSheet';
import { NOTE_COLORS, radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { store, useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import type { Task } from '../lib/types';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function NoteScreen({ route, navigation }: { route: any; navigation: any }) {
  const { noteId, focusTitle, openShare } = route.params as { noteId: string; focusTitle?: boolean; openShare?: boolean };
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  const { session } = useAuth(); const me = session!.user.id;
  const note = useStore((s) => s.notes[noteId]);
  const tasks = useStore((s) => s.tasks[noteId]) ?? [];
  const members = useStore((s) => s.members[noteId]) ?? [];

  const [title, setTitle] = useState(note?.title ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(!!openShare);
  const [taskMenu, setTaskMenu] = useState<Task | null>(null);
  const [pickDate, setPickDate] = useState<Task | null>(null);
  const [undo, setUndo] = useState<(() => void) | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const myName = members.find((m) => m.user_id === me)?.display_name || (session?.user.user_metadata?.full_name as string) || '';

  // gone (deleted by owner / removed) → leave the screen
  useEffect(() => { if (!note) navigation.goBack(); }, [note]);
  // clear the blue dot whenever we're looking at the note
  useEffect(() => { void store.markSeen(noteId); }, [noteId, note?.updated_at]);
  // debounce title writes
  useEffect(() => {
    if (!note || title === note.title) return;
    const h = setTimeout(() => store.updateNote(noteId, { title: title.slice(0, 200) }), 500);
    return () => clearTimeout(h);
  }, [title]);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const open = useMemo(() => tasks.filter((x) => !x.done), [tasks]);
  const done = useMemo(() => tasks.filter((x) => x.done), [tasks]);
  if (!note) return null;
  const bg = th.note[note.color];
  const shared = members.length > 1;

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const submitDraft = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length) { animate(); store.addTasks(noteId, lines); Haptics.selectionAsync(); }
    setDraft('');
    setTimeout(() => addRef.current?.focus(), 0);   // keep the row open for the next task
  };
  const onDraftChange = (v: string) => { if (v.includes('\n')) submitDraft(v); else setDraft(v); };

  const del = (task: Task) => {
    animate();
    const restore = store.deleteTask(noteId, task.id);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(() => () => { animate(); restore(); setUndo(null); });
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };

  const commitEdit = (task: Task, text: string) => {
    setEditingId(null);
    const v = text.trim();
    if (!v) { del(task); return; }
    if (v !== task.text) store.updateTask(noteId, task.id, { text: v.slice(0, 1000) });
  };

  const exportText = () => {
    const lines = [note.title || t('untitled'), '', ...open.map((x) => `[ ] ${x.text}`), ...done.map((x) => `[x] ${x.text}`)];
    void Share.share({ message: lines.join('\n') });
  };

  const confirmDelete = () => {
    const owner = note.owner_id === me;
    Alert.alert(owner ? t('deleteNoteQ') : t('leaveQ'), owner ? t('deleteNoteBody') : undefined, [
      { text: t('cancel'), style: 'cancel' },
      { text: owner ? t('delete') : t('leaveNote'), style: 'destructive', onPress: () => { owner ? store.deleteNote(noteId) : store.leaveNote(noteId); } },
    ]);
  };

  const setDue = (task: Task, d: Date | null) => { store.updateTask(noteId, task.id, { due_date: d ? iso(d) : null }); setTaskMenu(null); setPickDate(null); };
  const today = new Date(); const tomorrow = new Date(Date.now() + 86400000);

  const renderTask = (task: Task) => (
    <TaskRow key={task.id} task={task} showCreator={shared} editing={editingId === task.id}
      onToggle={() => { animate(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); store.updateTask(noteId, task.id, { done: !task.done }); }}
      onStartEdit={() => { setEditingId(task.id); }}
      onCommitEdit={(v) => commitEdit(task, v)} onDelete={() => del(task)} onMenu={() => setTaskMenu(task)} />
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: space.sm, flexDirection: 'row', alignItems: 'center' }}>
        <IconButton name="chevron-back" label={t('back')} onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          {shared && <AvatarStack people={members.map((m) => ({ id: m.user_id, name: m.display_name }))} ring={bg} size={28} max={4} />}
        </View>
        <IconButton name="person-add-outline" label={t('share')} onPress={() => setShareOpen(true)} />
        <IconButton name="ellipsis-horizontal" label="Menu" onPress={() => setMenuOpen(true)} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.xl, paddingBottom: space.xl, gap: space.lg }}>
        <Input value={title} onChangeText={setTitle} autoFocus={!!focusTitle} placeholder={t('untitled')} maxLength={200} multiline blurOnSubmit
          style={{ fontSize: 32, fontWeight: '700', lineHeight: 42, paddingVertical: 0 }} />
        <View>{open.map(renderTask)}</View>
        {done.length > 0 && (
          <View style={{ gap: space.sm }}>
            <View>{done.map(renderTask)}</View>
            <Button variant="ghost" title={t('clearDone')} onPress={() => { animate(); store.clearDone(noteId); }} />
          </View>
        )}
      </ScrollView>

      {undo && (
        <View style={{ position: 'absolute', start: space.lg, end: space.lg, bottom: insets.bottom + 88, backgroundColor: th.primary, borderRadius: radius.md,
          paddingHorizontal: space.lg, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: th.onPrimary }}>{t('taskDeleted')}</Text>
          <Pressable onPress={undo} hitSlop={10}><Text strong style={{ color: th.onPrimary, textDecorationLine: 'underline' }}>{t('undo')}</Text></Pressable>
        </View>
      )}

      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: insets.bottom + space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: th.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
          borderRadius: radius.pill, paddingHorizontal: space.lg, minHeight: 52 }}>
          <Ionicons name="add" size={22} color={th.textSecondary} />
          <Input ref={addRef} value={draft} onChangeText={onDraftChange} onSubmitEditing={() => submitDraft(draft)} blurOnSubmit={false}
            returnKeyType="done" placeholder={t('addTask')} multiline={false} maxLength={1000} style={{ flex: 1, paddingVertical: space.md }} />
        </View>
      </View>

      {/* note menu */}
      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {NOTE_COLORS.map((c) => (
            <Pressable key={c} accessibilityLabel={c} onPress={() => store.updateNote(noteId, { color: c })}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.note[c], borderWidth: note.color === c ? 2 : 0, borderColor: th.text }} />
          ))}
        </View>
        <MenuRow icon="copy-outline" label={t('duplicate')} onPress={() => { setMenuOpen(false); const id = store.duplicateNote(noteId); if (id) navigation.replace('Note', { noteId: id }); }} />
        <MenuRow icon="share-outline" label={t('exportText')} onPress={() => { setMenuOpen(false); exportText(); }} />
        <MenuRow icon="trash-outline" danger label={note.owner_id === me ? t('delete') : t('leaveNote')} onPress={() => { setMenuOpen(false); confirmDelete(); }} />
      </Sheet>

      {/* task menu: due date + reorder + delete */}
      <Sheet visible={!!taskMenu && !pickDate} onClose={() => setTaskMenu(null)} title={taskMenu?.text}>
        {taskMenu && (
          <>
            <MenuRow icon="today-outline" label={`${t('due')}: ${t('today')}`} onPress={() => setDue(taskMenu, today)} />
            <MenuRow icon="sunny-outline" label={`${t('due')}: ${t('tomorrow')}`} onPress={() => setDue(taskMenu, tomorrow)} />
            <MenuRow icon="calendar-outline" label={t('pickDate')} onPress={() => setPickDate(taskMenu)} />
            {taskMenu.due_date && <MenuRow icon="close-circle-outline" label={t('noDate')} onPress={() => setDue(taskMenu, null)} />}
            {!taskMenu.done && <MenuRow icon="arrow-up-outline" label={t('moveUp')} onPress={() => { animate(); store.moveTask(noteId, taskMenu.id, -1); setTaskMenu(null); }} />}
            {!taskMenu.done && <MenuRow icon="arrow-down-outline" label={t('moveDown')} onPress={() => { animate(); store.moveTask(noteId, taskMenu.id, 1); setTaskMenu(null); }} />}
            <MenuRow icon="trash-outline" danger label={t('delete')} onPress={() => { const x = taskMenu; setTaskMenu(null); del(x); }} />
          </>
        )}
      </Sheet>

      {pickDate && Platform.OS === 'ios' && (
        <Sheet visible onClose={() => { setPickDate(null); setTaskMenu(null); }} title={t('pickDate')}>
          <DateTimePicker value={pickDate.due_date ? new Date(`${pickDate.due_date}T00:00:00`) : today} mode="date" display="inline"
            onChange={(_, d) => d && setDue(pickDate, d)} />
        </Sheet>
      )}
      {pickDate && Platform.OS === 'android' && (
        <DateTimePicker value={pickDate.due_date ? new Date(`${pickDate.due_date}T00:00:00`) : today} mode="date"
          onChange={(e, d) => { if (e.type === 'set' && d) setDue(pickDate, d); else { setPickDate(null); setTaskMenu(null); } }} />
      )}

      <ShareSheet note={note} me={me} myName={myName} visible={shareOpen} onClose={() => setShareOpen(false)} />
    </KeyboardAvoidingView>
  );
}
