/**
 * Main Application Bootstrap
 * Initializes all modules and sets up the app
 */

import { initializeStorage } from './state/storage.js';
import { checkAndResumeTimer, startFast, stopFast, getActiveFastState } from './fasting/timer.js';
import { getProtocol } from './protocols/protocols.js';
import { requestNotificationPermissions, initializeNotifications } from './notifications/notifications.js';
import { initializeNavigation, showTab } from './ui/navigation.js';
import { initializeDashboard, renderDashboard } from './ui/dashboard.js';
import { initializeBodyStatsView } from './ui/bodyStatsView.js';
import { renderBadgesView } from './ui/badgesView.js';
import { initializeSettingsView, applyStoredTheme } from './ui/settingsView.js';
import { initializeHistoryView, renderHistoryView } from './ui/historyView.js';
import { initializeEducationView, renderEducationProtocols } from './ui/educationView.js';
import { scheduleSchedulerNotifications } from './scheduler/scheduler.js';
// RESTORED: Import meal and exercise modules
import { initializeDefaultMeals } from './meals/meals.js';
import { initializeMealsView } from './ui/mealsView.js';
import { initializeDefaultExercises } from './exercises/exercises.js';
import { initializeExercisesView } from './ui/exercisesView.js';
import { showFTUE, shouldShowFTUE } from './ui/ftue.js';

/**
 * Initialize the entire application
 */
async function initializeApp() {
  console.log('🚀 Initializing FastCore...');

  // 1. Initialize storage system
  initializeStorage();
  console.log('✅ Storage initialized');

  // 1b. Apply stored theme preference early
  applyStoredTheme();
  console.log('✅ Theme preference applied');

  // 2. RESTORED: Initialize default meals and exercises
  initializeDefaultMeals();
  initializeDefaultExercises();
  console.log('✅ Default data initialized');

  // 3. Request notification permissions
  try {
    await requestNotificationPermissions();
    console.log('✅ Notification permissions requested');
    await initializeNotifications();
  } catch (error) {
    console.warn('⚠️ Notification permissions denied or unavailable:', error);
  }

  // 4. Initialize navigation system
  initializeNavigation();
  console.log('✅ Navigation initialized');

  // 5. Initialize dashboard (timer, stats, controls)
  initializeDashboard();
  console.log('✅ Dashboard initialized');

  // 6. RESTORED: Initialize meals view
  initializeMealsView();
  console.log('✅ Meals view initialized');

  // 7. RESTORED: Initialize exercises view
  initializeExercisesView();
  console.log('✅ Exercises view initialized');

  // 8. Initialize body stats view
  initializeBodyStatsView();
  console.log('✅ Body Stats view initialized');

  // 9. Initialize settings view
  initializeSettingsView();
  console.log('✅ Settings view initialized');

  // 10. Initialize history view
  initializeHistoryView();
  console.log('✅ History view initialized');

  // 10b. Initialize education view
  initializeEducationView();
  console.log('✅ Education view initialized');

  // 11. Check and resume active timer if exists
  checkAndResumeTimer();
  console.log('✅ Timer state checked');

  // 11b. Schedule fasting reminders if enabled
  scheduleSchedulerNotifications();

  // 11. Register external start/stop handlers (e.g., widget)
  registerExternalFastHandlers();

  // 8. Set up tab change listeners for lazy rendering
  window.addEventListener('tabChanged', (e) => {
    const tab = e.detail.tab;

    if (tab === 'badgesTab') {
      renderBadgesView();
    }

    if (tab === 'historyTab') {
      renderHistoryView();
    }

    if (tab === 'educationTab') {
      renderEducationProtocols();
    }
  });

  window.addEventListener('notificationTapped', (e) => {
    const detail = e.detail || {};
    const notification = detail.notification || detail;
    const action = notification?.extra?.schedulerAction;
    if (!action) return;

    if (action === 'start') {
      window.startFastFromExternal?.();
    }

    if (action === 'end') {
      window.stopFastFromExternal?.();
    }
  });

  window.addEventListener('fastStateChanged', () => {
    scheduleSchedulerNotifications();
  });

  // 9. Set up badge unlock listener
  window.addEventListener('badgeUnlocked', (e) => {
    const { badge } = e.detail;
    showBadgeUnlockNotification(badge);
  });

  // 10. Show default tab (dashboard)
  showTab('dashboardTab');

  console.log('✅ App initialization complete');

  // 11. Show FTUE if this is first launch
  if (shouldShowFTUE()) {
    setTimeout(() => {
      showFTUE();
    }, 500);
  }
}

function registerExternalFastHandlers() {
  window.startFastFromExternal = async () => {
    const activeFast = getActiveFastState();
    if (activeFast && activeFast.isFastActive) {
      checkAndResumeTimer();
    } else {
      const protocolId = getSelectedProtocolId();
      await startFast(protocolId);
    }
    renderDashboard();
    if (window.notifyWidget) window.notifyWidget();
  };

  window.stopFastFromExternal = async () => {
    try {
      await stopFast();
    } catch (error) {
      console.error('Error stopping fast from external trigger:', error);
    }
    renderDashboard();
    if (window.notifyWidget) window.notifyWidget();
  };
}

function getSelectedProtocolId() {
  const select = document.getElementById('timerPhaseSelect');
  if (select && select.value) return select.value;
  return localStorage.getItem('selectedProtocol') || '8_16';
}

function buildWidgetState() {
  const activeFast = getActiveFastState();

  if (activeFast && activeFast.isFastActive) {
    return {
      isFasting: true,
      protocolId: activeFast.protocolId,
      fastingHours: activeFast.fastDurationHours || 0,
      eatingHours: Math.max(0, 24 - (activeFast.fastDurationHours || 0)),
      startTimestamp: new Date(activeFast.fastStartTime).getTime(),
      plannedEndTimestamp: new Date(activeFast.plannedEndTime).getTime()
    };
  }

  const protocolId = getSelectedProtocolId();
  const protocol = getProtocol(protocolId);
  return {
    isFasting: false,
    protocolId: protocolId,
    fastingHours: protocol.fastingHours || 0,
    eatingHours: protocol.eatingHours || 0,
    startTimestamp: 0,
    plannedEndTimestamp: 0
  };
}

window.notifyWidget = function() {
  if (window.AndroidWidget?.update) {
    window.AndroidWidget.update(JSON.stringify(buildWidgetState()));
  }
};

/**
 * Show badge unlock notification
 */
function showBadgeUnlockNotification(badge) {
  // Create a custom notification UI element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    max-width: 90%;
    text-align: center;
    animation: slideDown 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 8px;">${badge.icon}</div>
    <div style="font-size: 16px; font-weight: 700;">Badge Unlocked!</div>
    <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">${badge.displayName}</div>
  `;

  document.body.appendChild(notification);

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    style.textContent += `
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
      }
    `;
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 4000);
}

/**
 * Global notification function
 */
window.showNotification = function(message, type = 'info') {
  const notification = document.createElement('div');

  const colors = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type] || colors.info};
    color: white;
    padding: 14px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    max-width: 90%;
    text-align: center;
    font-size: 14px;
    animation: slideDown 0.3s ease-out;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
