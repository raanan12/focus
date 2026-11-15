import type { NoteColor } from './theme';

export type Note = {
  id: string; owner_id: string; title: string; color: NoteColor;
  created_at: string; updated_at: string; updated_by: string | null;
};
export type Member = {
  note_id: string; user_id: string; role: 'owner' | 'member';
  position: number; last_seen_at: string; joined_at?: string;
  display_name: string; avatar_url: string | null;
};
export type Task = {
  id: string; note_id: string; text: string; done: boolean; due_date: string | null;
  position: number; created_by: string | null; created_at: string; done_at: string | null;
};
export type Op =
  | { id: string; kind: 'note.create'; note: { id: string; title: string; color: NoteColor; owner_id: string } }
  | { id: string; kind: 'note.update'; noteId: string; patch: Partial<Pick<Note, 'title' | 'color'>> }
  | { id: string; kind: 'note.delete'; noteId: string }
  | { id: string; kind: 'note.leave'; noteId: string; userId: string }
  | { id: string; kind: 'member.position'; noteId: string; userId: string; position: number }
  | { id: string; kind: 'task.create'; task: Pick<Task, 'id' | 'note_id' | 'text' | 'done' | 'due_date' | 'position' | 'created_by'> }
  | { id: string; kind: 'task.update'; taskId: string; patch: Partial<Pick<Task, 'text' | 'done' | 'due_date' | 'position'>> }
  | { id: string; kind: 'task.delete'; taskId: string };
