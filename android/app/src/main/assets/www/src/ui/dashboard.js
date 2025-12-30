/**
 * Dashboard UI Module
 */

import { getTimerStats, startFast, stopFast, getActiveFastState, checkAndResumeTimer } from '../fasting/timer.js';
import { getFastingStats } from '../fasting/sessions.js';
import { getWeightChangeStats } from '../bodyStats/bodyStats.js';
import { getMaintenanceModeStatusMessage, isMaintenanceModeActive } from '../maintenance/maintenance.js';
import { getSchedulerSettings } from '../scheduler/scheduler.js';
import { storage, COLLECTIONS } from '../state/storage.js';

export function initializeDashboard() {
  setupFastingControls();
  setupTimerListeners();
  setupTimerOverlayInteraction(); // FIX 4: Timer overlay hover/tap
  renderDashboardStats();
  renderMaintenanceBanner();
  renderSchedulerHint();
  updateFastingUI(); // Restore UI state from persistent storage

  window.addEventListener('schedulerUpdated', () => {
    renderSchedulerHint();
  });
}

export function renderDashboard() {
  updateFastingUI();
}

function setupFastingControls() {
  const startBtn = document.getElementById('startFastBtn');
  const stopBtn = document.getElementById('stopFastBtn');
  const protocolSelect = document.getElementById('timerPhaseSelect');

  // Restore selected protocol from storage
  restoreSelectedProtocol();

  // Save protocol selection on change
  if (protocolSelect) {
    protocolSelect.addEventListener('change', () => {
      saveSelectedProtocol(protocolSelect.value);
    });
  }

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const protocolId = protocolSelect.value;
      try {
        const activeFast = getActiveFastState();
        if (activeFast && activeFast.isFastActive) {
          checkAndResumeTimer();
          updateFastingUI();
          if (window.notifyWidget) window.notifyWidget();
          showNotification('Fast already running', 'info');
          return;
        }

        await startFast(protocolId);
        updateFastingUI();
        if (window.notifyWidget) window.notifyWidget();
        showNotification('Fast started!', 'success');
      } catch (error) {
        console.error('Error starting fast:', error);
        showNotification('Unable to start fast', 'error');
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      if (confirm('Stop your fast and save it?')) {
        try {
          await stopFast();
          updateFastingUI();
          if (window.notifyWidget) window.notifyWidget();
          showNotification('Fast completed!', 'success');
        } catch (error) {
          console.error('Error stopping fast:', error);
          showNotification('Error stopping fast', 'error');
        }
      }
    });
  }
}

function setupTimerListeners() {
  window.addEventListener('timerUpdate', (e) => {
    updateTimerDisplay(e.detail);
    renderFastingWindow(); // FIX 1: Update fasting window on timer tick
  });

  window.addEventListener('fastPlannedEndReached', (e) => {
    showNotification(`Planned fast complete! You can continue or stop now.`, 'success');
  });
}

function updateTimerDisplay(data) {
  const { elapsedMs, isPastPlannedEnd, remainingToPlannedMs, currentPhase, plannedDurationHours } = data;

  const countdownEl = document.getElementById('timerCountdown');
  const statusEl = document.getElementById('timerStatus');
  const progressBar = document.getElementById('timerProgressBar');
  const phaseEl = document.getElementById('currentPhase');

  if (!countdownEl) return;

  if (!isPastPlannedEnd) {
    // Show countdown
    const hours = Math.floor(remainingToPlannedMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingToPlannedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingToPlannedMs % (1000 * 60)) / 1000);

    countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    countdownEl.style.color = 'var(--primary-color)';

    if (progressBar) {
      const progress = (elapsedMs / (plannedDurationHours * 60 * 60 * 1000)) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressBar.style.background = 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)';
    }
  } else {
    // Show elapsed time (extended fast)
    const totalHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

    countdownEl.textContent = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`;
    countdownEl.style.color = '#f59e0b';

    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.style.background = 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #fbbf24 10px, #fbbf24 20px)';
    }

    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #f59e0b; font-weight: 700;">⚠️ Extended Fast</span>`;
    }
  }

  if (phaseEl && currentPhase) {
    phaseEl.innerHTML = `
      <div style="font-size: 18px; font-weight: 600;">${currentPhase.displayTitle}</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${currentPhase.shortSummary}</div>
    `;
  }
}

function updateFastingUI() {
  const stats = getTimerStats();
  const startBtn = document.getElementById('startFastBtn');
  const stopBtn = document.getElementById('stopFastBtn');
  const timerDisplay = document.getElementById('timerDisplay');

  if (stats && stats.isActive) {
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    if (timerDisplay) timerDisplay.style.display = 'block';
    renderFastingWindow(); // FIX 1: Render fasting window when fast is active
  } else {
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (timerDisplay) timerDisplay.style.display = 'none';
  }

  renderDashboardStats();
}

function renderDashboardStats() {
  const stats = getFastingStats();
  const weightStats = getWeightChangeStats();

  const totalFastsEl = document.getElementById('totalFasts');
  const totalHoursEl = document.getElementById('totalHours');
  const currentStreakEl = document.getElementById('currentStreak');

  if (totalFastsEl) totalFastsEl.textContent = stats.totalFasts;
  if (totalHoursEl) totalHoursEl.textContent = stats.totalHours + 'h';
  if (currentStreakEl) currentStreakEl.textContent = stats.currentStreak + ' days';
}

function renderSchedulerHint() {
  const hint = document.getElementById('schedulerHint');
  if (!hint) return;

  const settings = getSchedulerSettings();
  if (!settings.enabled) {
    hint.textContent = '';
    return;
  }

  hint.textContent = `Scheduled: ${formatScheduleTime(settings.startTime)} – ${formatScheduleTime(settings.endTime)}`;
}

function formatScheduleTime(timeValue) {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function renderMaintenanceBanner() {
  const banner = document.getElementById('maintenanceModeBanner');
  if (!banner) return;

  if (isMaintenanceModeActive()) {
    const message = getMaintenanceModeStatusMessage();
    banner.style.display = 'block';
    banner.innerHTML = `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="font-weight: 700; font-size: 15px;">🔄 ${message}</div>
      </div>
    `;
  } else {
    banner.style.display = 'none';
  }
}

function showNotification(message, type) {
  console.log(`[${type}] ${message}`);
  // Simple alert for now - can be enhanced with custom notification UI
  if (window.showNotification) {
    window.showNotification(message, type);
  }
}

/**
 * FIX 1: Render fasting window (start time → planned end time)
 * Displays the actual time window for the current fast
 */
function renderFastingWindow() {
  const fastingWindowEl = document.getElementById('fastingWindow');
  if (!fastingWindowEl) return;

  const fastState = getActiveFastState();
  if (!fastState || !fastState.isFastActive) {
    fastingWindowEl.innerHTML = '';
    return;
  }

  // Format times to locale-friendly format (e.g., "6:30 PM")
  const startTime = new Date(fastState.fastStartTime);
  const plannedEndTime = new Date(fastState.plannedEndTime);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const startDateStr = formatDate(startTime);
  const endDateStr = formatDate(plannedEndTime);
  const startTimeStr = formatTime(startTime);
  const endTimeStr = formatTime(plannedEndTime);

  // Display with day labels if crossing days
  let windowText = '';
  if (startDateStr === endDateStr) {
    windowText = `Fasting Window: ${startTimeStr} → ${endTimeStr}`;
  } else {
    windowText = `Fasting Window: ${startDateStr} ${startTimeStr} → ${endDateStr} ${endTimeStr}`;
  }

  fastingWindowEl.innerHTML = windowText;
}

/**
 * FIX 4: Setup timer overlay hover/tap interaction
 * Makes the phase overlay fade in on hover (desktop) or tap (mobile)
 */
function setupTimerOverlayInteraction() {
  const phaseEl = document.getElementById('currentPhase');
  if (!phaseEl) return;

  let isMobileDevice = 'ontouchstart' in window;
  let tapTimeout = null;

  if (isMobileDevice) {
    // Mobile: Tap to toggle visibility with auto-hide after 3 seconds
    phaseEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const isVisible = phaseEl.classList.contains('visible');

      if (isVisible) {
        // Hide if already visible
        phaseEl.classList.remove('visible');
        if (tapTimeout) clearTimeout(tapTimeout);
      } else {
        // Show and auto-hide after 3 seconds
        phaseEl.classList.add('visible');
        if (tapTimeout) clearTimeout(tapTimeout);
        tapTimeout = setTimeout(() => {
          phaseEl.classList.remove('visible');
        }, 3000);
      }
    });
  } else {
    // Desktop: Hover to show/hide
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
      timerDisplay.addEventListener('mouseenter', () => {
        phaseEl.classList.add('visible');
      });

      timerDisplay.addEventListener('mouseleave', () => {
        phaseEl.classList.remove('visible');
      });
    }
  }
}

function saveSelectedProtocol(protocolId) {
  storage.setValue(COLLECTIONS.SELECTED_PROTOCOL, protocolId);
  console.log('Protocol saved:', protocolId);
}

function restoreSelectedProtocol() {
  const protocolSelect = document.getElementById('timerPhaseSelect');
  if (!protocolSelect) return;

  const savedProtocol = storage.getValue(COLLECTIONS.SELECTED_PROTOCOL);
  if (savedProtocol) {
    protocolSelect.value = savedProtocol;
    console.log('Protocol restored:', savedProtocol);
  }
}
