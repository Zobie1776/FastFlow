/**
 * Capacitor Local Notifications (Fully Offline)
 *
 * Requires: @capacitor/local-notifications
 * Installation: npm install @capacitor/local-notifications && npx cap sync
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { getProtocol } from '../protocols/protocols.js';
import { FASTING_PHASES } from '../fasting/phases.js';

/**
 * Check if Capacitor is available
 * @returns {boolean}
 */
export function isCapacitorAvailable() {
  return typeof window.Capacitor !== 'undefined';
}

/**
 * Check if notifications are supported
 * @returns {Promise<boolean>}
 */
export async function areNotificationsSupported() {
  if (!isCapacitorAvailable()) {
    console.log('Capacitor not available - running in browser');
    return false;
  }

  try {
    const { LocalNotifications } = window.Capacitor.Plugins;
    if (!LocalNotifications) return false;

    const result = await LocalNotifications.checkPermissions();
    return result.display !== 'denied';
  } catch (error) {
    console.warn('Notifications not supported:', error);
    return false;
  }
}

/**
 * Request notification permissions
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermissions() {
  if (!isCapacitorAvailable()) {
    console.log('Capacitor not available');
    return false;
  }

  try {
    const { LocalNotifications } = window.Capacitor.Plugins;
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  if (!await areNotificationsSupported()) return;

  try {
    const { LocalNotifications } = window.Capacitor.Plugins;
    const pending = await LocalNotifications.getPending();

    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
      console.log(`Cancelled ${pending.notifications.length} notifications`);
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

/**
 * Get notification preferences
 * @returns {object}
 */
export function getNotificationPreferences() {
  const prefs = storage.getValue(COLLECTIONS.NOTIFICATION_PREFS);
  if (!prefs) {
    return {
      fastEnding: true,
      waterReminders: true,
      phaseTransitions: false,
      badges: true,
      waterIntervalMinutes: 60
    };
  }
  return JSON.parse(prefs);
}

/**
 * Save notification preferences
 * @param {object} prefs - Preferences
 */
export function saveNotificationPreferences(prefs) {
  storage.setValue(COLLECTIONS.NOTIFICATION_PREFS, JSON.stringify(prefs));
}

/**
 * Get water reminder interval based on maintenance mode
 * @returns {number} Interval in minutes
 */
function getWaterReminderInterval() {
  const maintenanceState = storage.getValue(COLLECTIONS.MAINTENANCE_STATE);
  const isMaintenanceActive = maintenanceState ? JSON.parse(maintenanceState).isActive : false;

  return isMaintenanceActive ? 120 : 60; // 2 hours in maintenance, 1 hour normal
}

/**
 * Check if phase transition notifications should be shown
 * @returns {boolean}
 */
function shouldShowPhaseTransitionNotifications() {
  const maintenanceState = storage.getValue(COLLECTIONS.MAINTENANCE_STATE);
  const isMaintenanceActive = maintenanceState ? JSON.parse(maintenanceState).isActive : false;

  if (isMaintenanceActive) {
    return false; // Disabled in maintenance mode
  }

  const prefs = getNotificationPreferences();
  return prefs.phaseTransitions === true;
}

/**
 * Schedule notifications for an active fast
 * @param {object} fastState - Active fast state
 */
export async function scheduleNotificationsForFast(fastState) {
  if (!await areNotificationsSupported()) {
    console.log('Notifications not supported - skipping');
    return;
  }

  try {
    // Cancel existing notifications
    await cancelAllNotifications();

    const { LocalNotifications } = window.Capacitor.Plugins;
    const prefs = getNotificationPreferences();
    const notifications = [];

    const startTime = new Date(fastState.fastStartTime);
    const plannedEndTime = new Date(fastState.plannedEndTime);
    const protocol = getProtocol(fastState.protocolId);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. FAST ENDING SOON NOTIFICATION
    // ═══════════════════════════════════════════════════════════════════════
    if (prefs.fastEnding !== false) {
      const notificationOffset = protocol.notificationOffset || 1;
      const endWarningTime = new Date(plannedEndTime.getTime() - (notificationOffset * 60 * 60 * 1000));

      if (endWarningTime > new Date()) {
        notifications.push({
          id: 1,
          title: '⏰ Fast Ending Soon',
          body: `Your ${protocol.displayName} fast ends in ${notificationOffset} hour(s)`,
          schedule: { at: endWarningTime },
          sound: 'default',
          smallIcon: 'ic_stat_fast_ending'
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. FAST COMPLETE NOTIFICATION (timer continues)
    // ═══════════════════════════════════════════════════════════════════════
    if (prefs.fastEnding !== false) {
      if (plannedEndTime > new Date()) {
        notifications.push({
          id: 2,
          title: '🎉 Planned Fast Complete!',
          body: `${fastState.fastDurationHours}h fast complete! You can continue or stop now.`,
          schedule: { at: plannedEndTime },
          sound: 'default',
          smallIcon: 'ic_stat_fast_complete'
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. WATER REMINDERS (interval-based)
    // ═══════════════════════════════════════════════════════════════════════
    if (prefs.waterReminders !== false) {
      const waterIntervalMinutes = getWaterReminderInterval();
      const waterIntervalMs = waterIntervalMinutes * 60 * 1000;

      let waterReminderTime = new Date(startTime.getTime() + waterIntervalMs);
      let waterNotificationId = 100;

      // Schedule up to 24 water reminders
      while (waterReminderTime < plannedEndTime && waterNotificationId < 124) {
        if (waterReminderTime > new Date()) {
          notifications.push({
            id: waterNotificationId,
            title: '💧 Hydration Reminder',
            body: 'Time to drink water! Stay hydrated during your fast.',
            schedule: { at: waterReminderTime },
            sound: 'default',
            smallIcon: 'ic_stat_water'
          });
        }
        waterReminderTime = new Date(waterReminderTime.getTime() + waterIntervalMs);
        waterNotificationId++;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. PHASE TRANSITION NOTIFICATIONS (optional)
    // ═══════════════════════════════════════════════════════════════════════
    if (shouldShowPhaseTransitionNotifications()) {
      const phasesToNotify = FASTING_PHASES.filter(phase => {
        const phaseStartTime = new Date(startTime.getTime() + (phase.startHour * 60 * 60 * 1000));
        return phaseStartTime > new Date() && phaseStartTime < plannedEndTime;
      });

      let phaseNotificationId = 200;
      phasesToNotify.forEach(phase => {
        const phaseStartTime = new Date(startTime.getTime() + (phase.startHour * 60 * 60 * 1000));

        if (phaseStartTime > new Date() && phaseNotificationId < 220) {
          notifications.push({
            id: phaseNotificationId,
            title: `✨ New Phase: ${phase.displayTitle}`,
            body: phase.shortSummary,
            schedule: { at: phaseStartTime },
            sound: 'default',
            smallIcon: 'ic_stat_phase'
          });
          phaseNotificationId++;
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULE ALL NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`📬 Scheduled ${notifications.length} notifications`);
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

/**
 * Show immediate notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export async function showImmediateNotification(title, body) {
  if (!await areNotificationsSupported()) return;

  try {
    const { LocalNotifications } = window.Capacitor.Plugins;
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 1000000),
        title,
        body,
        schedule: { at: new Date(Date.now() + 1000) },
        sound: 'default'
      }]
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Initialize notification system
 */
export async function initializeNotifications() {
  if (!isCapacitorAvailable()) {
    console.log('Capacitor not available - notifications disabled');
    return;
  }

  try {
    const granted = await requestNotificationPermissions();

    if (!granted) {
      console.log('Notification permissions not granted');
      return;
    }

    const { LocalNotifications } = window.Capacitor.Plugins;

    // Listen for notification taps
    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notification tapped:', notification);

      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('notificationTapped', {
        detail: notification
      }));
    });

    console.log('✅ Notification system initialized');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}
