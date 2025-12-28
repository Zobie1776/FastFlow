/**
 * Settings View UI Module
 */

import { isMaintenanceModeActive, toggleMaintenanceMode, getMaintenanceState } from '../maintenance/maintenance.js';
import { getNotificationPreferences, saveNotificationPreferences } from '../notifications/notifications.js';
import { exportAllData, importAllData } from '../state/storage.js';
import { getSchedulerSettings, saveSchedulerSettings, scheduleSchedulerNotifications } from '../scheduler/scheduler.js';

const THEME_STORAGE_KEY = 'fastflow_theme';
let themeMediaQuery = null;
let themeMediaHandler = null;

export function initializeSettingsView() {
  setupMaintenanceModeToggle();
  setupNotificationSettings();
  setupSchedulerSettings();
  setupDataManagement();
  setupThemeSettings();
  setupNotificationStatusBanner();
  renderMaintenanceStatus();
}

export function applyStoredTheme() {
  const storedTheme = getStoredTheme();
  applyTheme(storedTheme);
}

function setupMaintenanceModeToggle() {
  const toggleBtn = document.getElementById('toggleMaintenanceModeBtn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    toggleMaintenanceMode();
    renderMaintenanceStatus();
    showNotification('Maintenance mode ' + (isMaintenanceModeActive() ? 'activated' : 'deactivated'), 'success');
  });

  // Listen for maintenance mode changes
  window.addEventListener('maintenanceModeChanged', () => {
    renderMaintenanceStatus();
  });
}

function renderMaintenanceStatus() {
  const statusEl = document.getElementById('maintenanceModeStatus');
  const toggleBtn = document.getElementById('toggleMaintenanceModeBtn');

  if (!statusEl || !toggleBtn) return;

  const isActive = isMaintenanceModeActive();
  const state = getMaintenanceState();

  if (isActive) {
    const activatedDate = new Date(state.activatedAt);
    const daysActive = Math.floor((new Date() - activatedDate) / (1000 * 60 * 60 * 24));

    statusEl.innerHTML = `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
        <div style="font-weight: 700; font-size: 15px;">✅ Maintenance Mode Active</div>
        <div style="font-size: 13px; margin-top: 6px; opacity: 0.9;">
          Active for ${daysActive} days • Flexibility-focused protocols
        </div>
      </div>
    `;
    toggleBtn.textContent = 'Deactivate Maintenance Mode';
    toggleBtn.className = 'btn btn-outline';
  } else {
    statusEl.innerHTML = `
      <div style="padding: 16px; border-radius: 8px; background: #f1f5f9; margin-bottom: 12px;">
        <div style="font-weight: 600; color: #64748b;">Maintenance Mode Inactive</div>
        <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
          Activate when you've reached your goals to switch to flexibility mode
        </div>
      </div>
    `;
    toggleBtn.textContent = 'Activate Maintenance Mode';
    toggleBtn.className = 'btn btn-primary';
  }
}

function setupNotificationSettings() {
  const form = document.getElementById('notificationSettingsForm');
  if (!form) return;

  // Load current preferences
  const prefs = getNotificationPreferences();

  const fastEndingCheckbox = document.getElementById('notifyFastEnding');
  const fastCompleteCheckbox = document.getElementById('notifyFastComplete');
  const waterRemindersCheckbox = document.getElementById('notifyWaterReminders');
  const phaseTransitionCheckbox = document.getElementById('notifyPhaseTransition');

  if (fastEndingCheckbox) fastEndingCheckbox.checked = prefs.fastEndingSoon;
  if (fastCompleteCheckbox) fastCompleteCheckbox.checked = prefs.fastComplete;
  if (waterRemindersCheckbox) waterRemindersCheckbox.checked = prefs.waterReminders;
  if (phaseTransitionCheckbox) phaseTransitionCheckbox.checked = prefs.phaseTransitions;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newPrefs = {
      fastEndingSoon: fastEndingCheckbox?.checked || false,
      fastComplete: fastCompleteCheckbox?.checked || false,
      waterReminders: waterRemindersCheckbox?.checked || false,
      phaseTransitions: phaseTransitionCheckbox?.checked || false
    };

    saveNotificationPreferences(newPrefs);
    showNotification('Notification preferences saved', 'success');
  });
}

function setupSchedulerSettings() {
  const enabledToggle = document.getElementById('schedulerEnabled');
  const startTimeInput = document.getElementById('schedulerStartTime');
  const endTimeInput = document.getElementById('schedulerEndTime');

  if (!enabledToggle || !startTimeInput || !endTimeInput) return;

  const settings = getSchedulerSettings();
  enabledToggle.checked = settings.enabled;
  startTimeInput.value = settings.startTime;
  endTimeInput.value = settings.endTime;

  const persist = () => {
    const updated = {
      enabled: enabledToggle.checked,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value
    };
    saveSchedulerSettings(updated);
    scheduleSchedulerNotifications();
    window.dispatchEvent(new CustomEvent('schedulerUpdated'));
  };

  enabledToggle.addEventListener('change', persist);
  startTimeInput.addEventListener('change', persist);
  endTimeInput.addEventListener('change', persist);
}

function setupNotificationStatusBanner() {
  const banner = document.getElementById('notificationStatusBanner');
  const globalBanner = document.getElementById('notificationStatusBannerGlobal');
  const bannerKey = 'fastflow_notifications_banner_seen';
  if (localStorage.getItem(bannerKey)) return;

  if (!window.AndroidNotifications?.isNotificationsEnabled) return;

  try {
    const enabled = window.AndroidNotifications.isNotificationsEnabled();
    if (enabled) {
      console.log('Notifications enabled');
      return;
    }

    const bannerMarkup = `
      <div class="alert alert-info">
        Notifications are disabled. Enable them to receive fasting alerts.
        <div style="margin-top: 10px;">
          <button id="openNotificationSettingsBtn" class="btn btn-outline btn-block">Enable Notifications</button>
        </div>
      </div>
    `;

    if (globalBanner) {
      globalBanner.innerHTML = bannerMarkup;
    }

    if (banner) {
      banner.innerHTML = bannerMarkup;
    }

    const settingsBtn = document.getElementById('openNotificationSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        window.AndroidNotifications.requestPermission?.();
        window.AndroidNotifications.openNotificationSettings?.();
      });
    }

    if (globalBanner || banner) {
      localStorage.setItem(bannerKey, 'true');
    }
    console.log('Notifications disabled');
  } catch (error) {
    console.error('Failed to check notification status', error);
  }
}

function setupDataManagement() {
  const exportBtn = document.getElementById('exportDataBtn');
  const importBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const allData = exportAllData();
      const dataStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `fasting-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
      showNotification('Data exported successfully', 'success');
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          importAllData(data);
          showNotification('Data imported successfully. Refreshing...', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          console.error('Import error:', error);
          showNotification('Error importing data. Please check the file format.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // FIX 3: Clear cache / reset data button
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      const confirmed = confirm(
        '⚠️ WARNING: This will permanently delete ALL your data including:\n\n' +
        '• Fasting sessions\n' +
        '• Body stats\n' +
        '• Meals\n' +
        '• Badges\n' +
        '• Settings\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure you want to continue?'
      );

      if (confirmed) {
        // Double confirmation for safety
        const doubleConfirm = confirm(
          'FINAL CONFIRMATION:\n\n' +
          'This is your last chance to cancel.\n\n' +
          'Click OK to DELETE ALL DATA and reset the app.'
        );

        if (doubleConfirm) {
          try {
            // Clear all localStorage
            localStorage.clear();
            showNotification('All data cleared. Reloading app...', 'success');

            // Reload the app after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (error) {
            console.error('Error clearing cache:', error);
            showNotification('Error clearing data. Please try again.', 'error');
          }
        }
      }
    });
  }
}

function setupThemeSettings() {
  const radios = document.querySelectorAll('input[name="themePreference"]');
  if (!radios.length) return;

  const storedTheme = getStoredTheme();
  radios.forEach((radio) => {
    radio.checked = radio.value === storedTheme;
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      persistTheme(radio.value);
      applyTheme(radio.value);
    });
  });

  ensureSystemThemeListener();
}

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
}

function persistTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'light' || theme === 'dark') {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }

  root.style.colorScheme = theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'light dark';

  const background = getComputedStyle(root).getPropertyValue('--bg-secondary').trim() || '#ffffff';
  document.body.style.backgroundColor = background;
  root.style.backgroundColor = background;
}

function ensureSystemThemeListener() {
  if (themeMediaQuery) return;
  themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  themeMediaHandler = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  if (themeMediaQuery.addEventListener) {
    themeMediaQuery.addEventListener('change', themeMediaHandler);
  } else if (themeMediaQuery.addListener) {
    themeMediaQuery.addListener(themeMediaHandler);
  }
}

function showNotification(message, type) {
  console.log(`[${type}] ${message}`);
  if (window.showNotification) {
    window.showNotification(message, type);
  }
}
