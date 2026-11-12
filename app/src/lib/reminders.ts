// Local due-date reminders ("Today: <task>") — scheduled on-device, no push server needed.
import * as Notifications from 'expo-notifications';
import type { Task } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function syncReminders(tasks: Task[], enabled: boolean, todayLabel: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  const now = Date.now();
  let n = 0;
  for (const t of tasks) {
    if (t.done || !t.due_date || n >= 60) continue;
    const at = new Date(`${t.due_date}T09:00:00`);
    if (at.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: `${todayLabel}: ${t.text}` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
    n++;
  }
}

export async function askNotificationPermission() {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}
