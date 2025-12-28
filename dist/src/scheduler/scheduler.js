/**
 * Fasting Scheduler (Optional)
 */

import { storage } from '../state/storage.js';
import { areNotificationsSupported } from '../notifications/notifications.js';
import { getActiveFastState } from '../fasting/timer.js';

const SCHEDULER_KEY = 'fasting_scheduler';
const LAST_SCHEDULED_KEY = 'fasting_scheduler_last_scheduled';
const START_NOTIFICATION_ID = 4101;
const END_NOTIFICATION_ID = 4102;

const DEFAULT_SETTINGS = {
  enabled: false,
  startTime: '20:00',
  endTime: '12:00'
};

export function getSchedulerSettings() {
  const stored = storage.getValue(SCHEDULER_KEY);
  if (!stored) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(stored);
    return {
      enabled: !!parsed.enabled,
      startTime: parsed.startTime || DEFAULT_SETTINGS.startTime,
      endTime: parsed.endTime || DEFAULT_SETTINGS.endTime
    };
  } catch (error) {
    console.error('Error reading fasting scheduler settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSchedulerSettings(settings) {
  storage.setValue(SCHEDULER_KEY, JSON.stringify(settings));
}

export async function scheduleSchedulerNotifications() {
  const settings = getSchedulerSettings();

  if (!settings.enabled) {
    await cancelSchedulerNotifications();
    storage.setValue(LAST_SCHEDULED_KEY, '');
    return;
  }

  if (!await areNotificationsSupported()) {
    console.log('Notifications not supported - skipping scheduler');
    return;
  }

  const { LocalNotifications } = window.Capacitor.Plugins;
  const now = new Date();
  const nextStart = getNextOccurrence(settings.startTime, now);
  const nextEnd = getNextOccurrence(settings.endTime, now);
  const scheduleKey = `${nextStart.toDateString()}|${nextEnd.toDateString()}|${isFasting}`;
  const lastScheduled = storage.getValue(LAST_SCHEDULED_KEY);
  const activeFast = getActiveFastState();
  const isFasting = !!(activeFast && activeFast.isFastActive);

  if (lastScheduled === scheduleKey) {
    return;
  }

  await cancelSchedulerNotifications();

  const notifications = [];

  if (!isFasting) {
    notifications.push({
      id: START_NOTIFICATION_ID,
      title: "It’s time to start your fast",
      body: 'Tap to begin when you’re ready.',
      schedule: { at: nextStart },
      sound: 'default',
      extra: { schedulerAction: 'start' }
    });
  }

  if (isFasting) {
    notifications.push({
      id: END_NOTIFICATION_ID,
      title: 'Your fasting window is complete',
      body: 'Tap to end your fast when you’re ready.',
      schedule: { at: nextEnd },
      sound: 'default',
      extra: { schedulerAction: 'end' }
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    storage.setValue(LAST_SCHEDULED_KEY, scheduleKey);
    console.log('✅ Scheduler notifications scheduled');
  }
}

export async function cancelSchedulerNotifications() {
  if (!await areNotificationsSupported()) return;

  try {
    const { LocalNotifications } = window.Capacitor.Plugins;
    await LocalNotifications.cancel({
      notifications: [
        { id: START_NOTIFICATION_ID },
        { id: END_NOTIFICATION_ID }
      ]
    });
  } catch (error) {
    console.error('Error cancelling scheduler notifications:', error);
  }
}

function getNextOccurrence(timeValue, reference) {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const next = new Date(reference);
  next.setHours(hours, minutes, 0, 0);
  if (next <= reference) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}
