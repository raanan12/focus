// Local due-date reminders ("Today: <task>") — scheduled on-device, no push server needed.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Task } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const CHANNEL = 'reminders';

/** Android 8+ requires a notification channel; the user can tune it in system settings. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
}

export async function syncReminders(tasks: Task[], enabled: boolean, todayLabel: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  await ensureChannel();
  const now = Date.now();
  let n = 0;
  for (const t of tasks) {
    if (t.done || !t.due_date || n >= 60) continue;
    const at = new Date(`${t.due_date}T09:00:00`);
    if (at.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: `${todayLabel}: ${t.text}` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
    n++;
  }
}

export async function askNotificationPermission() {
  await ensureChannel();   // Android 13+ only shows the permission prompt once a channel exists
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}
