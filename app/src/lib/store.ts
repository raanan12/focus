// Offline-first data store: optimistic local state + persisted mutation queue + realtime.
// All creates use client-generated UUIDs and ON CONFLICT DO NOTHING, so retries are idempotent.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Member, Note, Op, Task } from './types';
import type { NoteColor } from './theme';

export type State = {
  ready: boolean;
  online: boolean;
  syncing: boolean;
  pending: number;
  notes: Record<string, Note>;
  members: Record<string, Member[]>;
  tasks: Record<string, Task[]>;
};

type NewOp = Op extends infer O ? (O extends { id: string } ? Omit<O, 'id'> : never) : never;
const empty: State = { ready: false, online: true, syncing: false, pending: 0, notes: {}, members: {}, tasks: {} };
const uuid = () => Crypto.randomUUID();
const byPos = (a: { position: number }, b: { position: number }) => a.position - b.position;

class Store {
  state: State = empty;
  private listeners = new Set<() => void>();
  private userId: string | null = null;
  private queue: Op[] = [];
  private flushing = false;
  private channel: RealtimeChannel | null = null;
  private unsubNet: (() => void) | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = () => this.state;
  private set(patch: Partial<State>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
    this.schedulePersist();
  }

  // ---------- lifecycle ----------
  async start(userId: string) {
    if (this.userId === userId) return;
    this.stop();
    this.userId = userId;
    const [cache, q] = await Promise.all([
      AsyncStorage.getItem(`duo:cache:${userId}`), AsyncStorage.getItem(`duo:queue:${userId}`),
    ]);
    this.queue = q ? JSON.parse(q) : [];
    const cached = cache ? JSON.parse(cache) : {};
    this.state = { ...empty, ...cached, ready: !!cache, syncing: false, pending: this.queue.length };
    this.listeners.forEach((l) => l());

    this.unsubNet = NetInfo.addEventListener((s) => {
      const online = !!s.isConnected && s.isInternetReachable !== false;
      const wasOffline = !this.state.online;
      this.set({ online });
      if (online && wasOffline) void this.sync();
    });
    this.channel = supabase.channel(`duo:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (p) => this.onTask(p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (p) => this.onNote(p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_members' }, () => this.debouncedRefresh())
      .subscribe();
    await this.sync();
  }

  stop() {
    this.channel && supabase.removeChannel(this.channel);
    this.channel = null;
    this.unsubNet?.(); this.unsubNet = null;
    this.userId = null; this.queue = [];
    this.state = empty;
    this.listeners.forEach((l) => l());
  }

  /** Wipe the on-device cache (sign-out / account deletion). */
  async clearLocal(userId: string) {
    await AsyncStorage.multiRemove([`duo:cache:${userId}`, `duo:queue:${userId}`, `duo:sample:${userId}`]);
  }

  private schedulePersist() {
    if (!this.userId) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    const uid = this.userId;
    this.persistTimer = setTimeout(() => {
      const { notes, members, tasks } = this.state;
      void AsyncStorage.setItem(`duo:cache:${uid}`, JSON.stringify({ notes, members, tasks }));
      void AsyncStorage.setItem(`duo:queue:${uid}`, JSON.stringify(this.queue));
    }, 300);
  }

  // ---------- sync ----------
  async sync() {
    if (!this.userId) return;
    this.set({ syncing: true });
    const ok = await this.flush();
    if (ok) await this.refresh();
    this.set({ syncing: false, ready: true });
  }

  private debouncedRefresh() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => { if (this.queue.length === 0) void this.refresh(); }, 400);
  }

  private async fetchAll<T>(table: string, select: string, order?: string): Promise<T[] | null> {
    const out: T[] = [];
    for (let from = 0; ; from += 1000) {
      let q = supabase.from(table).select(select).range(from, from + 999);
      if (order) q = q.order(order);
      const { data, error } = await q;
      if (error) return null;
      out.push(...(data as T[]));
      if (!data || data.length < 1000) return out;
    }
  }

  async refresh() {
    if (!this.userId) return;
    const [notes, mem, tasks] = await Promise.all([
      this.fetchAll<Note>('notes', '*'),
      this.fetchAll<any>('note_members', 'note_id,user_id,role,position,last_seen_at,profiles(display_name,avatar_url)'),
      this.fetchAll<Task>('tasks', '*', 'position'),
    ]);
    if (!notes || !mem || !tasks) return;           // offline / error → keep cache
    if (this.queue.length > 0) return;              // local changes pending → don't clobber them
    const n: Record<string, Note> = {}; notes.forEach((x) => (n[x.id] = x));
    const m: Record<string, Member[]> = {};
    mem.forEach((r) => {
      (m[r.note_id] ??= []).push({
        note_id: r.note_id, user_id: r.user_id, role: r.role, position: r.position, last_seen_at: r.last_seen_at,
        display_name: r.profiles?.display_name ?? '', avatar_url: r.profiles?.avatar_url ?? null,
      });
    });
    const t: Record<string, Task[]> = {};
    tasks.forEach((x) => { if (n[x.note_id]) (t[x.note_id] ??= []).push(x); });
    Object.values(t).forEach((l) => l.sort(byPos));
    this.set({ notes: n, members: m, tasks: t });
  }

  // ---------- realtime handlers ----------
  private onTask(p: any) {
    const tasks = { ...this.state.tasks };
    if (p.eventType === 'DELETE') {
      const id = p.old?.id;
      for (const k of Object.keys(tasks)) if (tasks[k].some((x) => x.id === id)) tasks[k] = tasks[k].filter((x) => x.id !== id);
    } else {
      const row = p.new as Task;
      if (!this.state.notes[row.note_id]) { this.debouncedRefresh(); return; }
      const list = (tasks[row.note_id] ?? []).filter((x) => x.id !== row.id);
      list.push(row); list.sort(byPos);
      tasks[row.note_id] = list;
    }
    this.set({ tasks });
  }
  private onNote(p: any) {
    if (p.eventType === 'DELETE') {
      const id = p.old?.id;
      const { [id]: _n, ...notes } = this.state.notes;
      const { [id]: _t, ...tasks } = this.state.tasks;
      const { [id]: _m, ...members } = this.state.members;
      this.set({ notes, tasks, members });
    } else {
      const row = p.new as Note;
      const known = !!this.state.notes[row.id];
      this.set({ notes: { ...this.state.notes, [row.id]: row } });
      if (!known) this.debouncedRefresh();
    }
  }

  // ---------- queue ----------
  private enqueue(op: NewOp) {
    this.queue.push({ ...op, id: uuid() } as Op);
    this.set({ pending: this.queue.length });
    void this.flush();
  }

  private async run(op: Op): Promise<{ error: { code?: string; message?: string; status?: number } | null }> {
    switch (op.kind) {
      case 'note.create':
        return supabase.from('notes').upsert(op.note, { onConflict: 'id', ignoreDuplicates: true });
      case 'note.update': return supabase.from('notes').update(op.patch).eq('id', op.noteId);
      case 'note.delete': return supabase.from('notes').delete().eq('id', op.noteId);
      case 'note.leave': return supabase.from('note_members').delete().eq('note_id', op.noteId).eq('user_id', op.userId);
      case 'member.position':
        return supabase.from('note_members').update({ position: op.position }).eq('note_id', op.noteId).eq('user_id', op.userId);
      case 'task.create': return supabase.from('tasks').upsert(op.task, { onConflict: 'id', ignoreDuplicates: true });
      case 'task.update': return supabase.from('tasks').update(op.patch).eq('id', op.taskId);
      case 'task.delete': return supabase.from('tasks').delete().eq('id', op.taskId);
    }
  }

  /** Returns true when the queue is fully drained. */
  private async flush(): Promise<boolean> {
    if (this.flushing) return false;
    this.flushing = true;
    try {
      while (this.queue.length > 0) {
        const op = this.queue[0];
        let error: { code?: string; message?: string; status?: number } | null;
        try { ({ error } = await this.run(op)); } catch { return false; }
        // Network failure (no PostgREST code) → keep the op, retry later.
        if (error && !error.code && (error.status === undefined || error.status === 0 || error.status >= 500)) return false;
        this.queue.shift();                           // success, or a permanent rejection → drop
        this.set({ pending: this.queue.length });
      }
      return true;
    } finally { this.flushing = false; }
  }

  // ---------- notes ----------
  private me() { if (!this.userId) throw new Error('not signed in'); return this.userId; }

  createNote(init: { title?: string; color?: NoteColor } = {}): string {
    const me = this.me();
    const id = uuid();
    const color = init.color ?? (['yellow', 'pink', 'blue', 'green', 'purple', 'orange'] as NoteColor[])[Math.floor(Math.random() * 6)];
    const now = new Date().toISOString();
    const note: Note = { id, owner_id: me, title: init.title ?? '', color, created_at: now, updated_at: now, updated_by: me };
    const prof = this.state.members && Object.values(this.state.members).flat().find((m) => m.user_id === me);
    const first = Math.min(0, ...Object.values(this.state.members).flat().filter((m) => m.user_id === me).map((m) => m.position)) - 1;
    this.set({
      notes: { ...this.state.notes, [id]: note },
      tasks: { ...this.state.tasks, [id]: [] },
      members: { ...this.state.members, [id]: [{ note_id: id, user_id: me, role: 'owner', position: first, last_seen_at: now, display_name: prof?.display_name ?? '', avatar_url: null }] },
    });
    this.enqueue({ kind: 'note.create', note: { id, title: note.title, color, owner_id: me } });
    return id;
  }
  updateNote(id: string, patch: Partial<Pick<Note, 'title' | 'color'>>) {
    const n = this.state.notes[id]; if (!n) return;
    this.set({ notes: { ...this.state.notes, [id]: { ...n, ...patch, updated_at: new Date().toISOString(), updated_by: this.me() } } });
    this.enqueue({ kind: 'note.update', noteId: id, patch });
  }
  private dropNote(id: string) {
    const { [id]: _n, ...notes } = this.state.notes;
    const { [id]: _t, ...tasks } = this.state.tasks;
    const { [id]: _m, ...members } = this.state.members;
    this.set({ notes, tasks, members });
  }
  deleteNote(id: string) { this.dropNote(id); this.enqueue({ kind: 'note.delete', noteId: id }); }
  leaveNote(id: string) { this.dropNote(id); this.enqueue({ kind: 'note.leave', noteId: id, userId: this.me() }); }
  removeMember(noteId: string, userId: string) {
    this.set({ members: { ...this.state.members, [noteId]: (this.state.members[noteId] ?? []).filter((m) => m.user_id !== userId) } });
    this.enqueue({ kind: 'note.leave', noteId, userId });
  }
  moveNoteToFront(id: string) {
    const me = this.me();
    const all = Object.values(this.state.members).flat().filter((m) => m.user_id === me);
    const position = Math.min(0, ...all.map((m) => m.position)) - 1;
    this.setMyPosition(id, position);
  }
  private setMyPosition(noteId: string, position: number) {
    const me = this.me();
    this.set({ members: { ...this.state.members, [noteId]: (this.state.members[noteId] ?? []).map((m) => (m.user_id === me ? { ...m, position } : m)) } });
    this.enqueue({ kind: 'member.position', noteId, userId: me, position });
  }
  duplicateNote(id: string): string | null {
    const n = this.state.notes[id]; if (!n) return null;
    const nid = this.createNote({ title: n.title, color: n.color });
    this.addTasks(nid, (this.state.tasks[id] ?? []).map((t) => t.text));
    return nid;
  }
  async markSeen(noteId: string) {
    const me = this.userId; if (!me) return;
    const n = this.state.notes[noteId]; if (!n) return;
    const seen = new Date(Math.max(Date.now(), Date.parse(n.updated_at))).toISOString();
    this.set({ members: { ...this.state.members, [noteId]: (this.state.members[noteId] ?? []).map((m) => (m.user_id === me ? { ...m, last_seen_at: seen } : m)) } });
    if (this.state.online) void supabase.rpc('mark_note_seen', { p_note_id: noteId });
  }

  // ---------- tasks ----------
  addTasks(noteId: string, texts: string[]) {
    const me = this.me();
    const clean = texts.map((t) => t.trim().slice(0, 1000)).filter(Boolean);
    if (!clean.length) return;
    const existing = this.state.tasks[noteId] ?? [];
    let pos = Math.max(0, ...existing.map((t) => t.position)) + 1;
    const now = new Date().toISOString();
    const created: Task[] = clean.map((text) => ({
      id: uuid(), note_id: noteId, text, done: false, due_date: null, position: pos++, created_by: me, created_at: now, done_at: null,
    }));
    this.set({ tasks: { ...this.state.tasks, [noteId]: [...existing, ...created] } });
    created.forEach((t) => this.enqueue({ kind: 'task.create', task: { id: t.id, note_id: noteId, text: t.text, done: false, due_date: null, position: t.position, created_by: me } }));
  }
  updateTask(noteId: string, id: string, patch: Partial<Pick<Task, 'text' | 'done' | 'due_date' | 'position'>>) {
    const list = this.state.tasks[noteId] ?? [];
    const next = list.map((t) => (t.id === id ? { ...t, ...patch, done_at: patch.done === undefined ? t.done_at : patch.done ? new Date().toISOString() : null } : t)).sort(byPos);
    this.set({ tasks: { ...this.state.tasks, [noteId]: next } });
    this.enqueue({ kind: 'task.update', taskId: id, patch });
  }
  /** Deletes locally now; the server delete is sent after 5s unless undone. */
  deleteTask(noteId: string, id: string): () => void {
    const list = this.state.tasks[noteId] ?? [];
    const task = list.find((t) => t.id === id); if (!task) return () => {};
    this.set({ tasks: { ...this.state.tasks, [noteId]: list.filter((t) => t.id !== id) } });
    const timer = setTimeout(() => this.enqueue({ kind: 'task.delete', taskId: id }), 5000);
    return () => {
      clearTimeout(timer);
      const cur = this.state.tasks[noteId] ?? [];
      this.set({ tasks: { ...this.state.tasks, [noteId]: [...cur, task].sort(byPos) } });
    };
  }
  clearDone(noteId: string) {
    const list = this.state.tasks[noteId] ?? [];
    this.set({ tasks: { ...this.state.tasks, [noteId]: list.filter((t) => !t.done) } });
    list.filter((t) => t.done).forEach((t) => this.enqueue({ kind: 'task.delete', taskId: t.id }));
  }
  /** Swap a task with its neighbour among the open tasks. */
  moveTask(noteId: string, id: string, dir: -1 | 1) {
    const open = (this.state.tasks[noteId] ?? []).filter((t) => !t.done).sort(byPos);
    const i = open.findIndex((t) => t.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= open.length) return;
    const a = open[i], b = open[j];
    this.updateTask(noteId, a.id, { position: b.position });
    this.updateTask(noteId, b.id, { position: a.position });
  }
}

export const store = new Store();
export const useStore = <T,>(selector: (s: State) => T): T =>
  selector(useSyncExternalStore(store.subscribe, store.getSnapshot));
