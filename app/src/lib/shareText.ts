import type { Task } from './types';

/** WhatsApp-formatted note: *bold* title, ☐ open tasks, ✅ ~struck~ done tasks, optional due dates. */
export function noteToWhatsApp(opts: {
  title: string; open: Task[]; done: Task[]; locale: string; dueLabel: string; footer: string;
}): string {
  const one = (s: string) => s.replace(/\s*\n+\s*/g, ' ').trim();
  const due = (t: Task) => (t.due_date
    ? ` (${opts.dueLabel} ${new Date(`${t.due_date}T00:00:00`).toLocaleDateString(opts.locale, { day: 'numeric', month: 'short' })})`
    : '');
  const lines: string[] = [`*${one(opts.title)}*`, ''];
  for (const t of opts.open) lines.push(`☐ ${one(t.text)}${due(t)}`);
  if (opts.open.length && opts.done.length) lines.push('');
  for (const t of opts.done) lines.push(`✅ ~${one(t.text)}~`);
  lines.push('', `_${opts.footer}_`);
  return lines.join('\n');
}
