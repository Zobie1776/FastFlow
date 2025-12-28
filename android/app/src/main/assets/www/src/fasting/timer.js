/**
 * Fasting Timer Module
 *
 * CRITICAL: Timer NEVER auto-stops
 * - Continues past planned protocol end time
 * - User must manually stop
 * - Shows "Extended Fast" state when past planned end
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { generateUUID, getDeviceId } from '../state/device.js';
import { getProtocol } from '../protocols/protocols.js';
import { detectPhase, calculateElapsedHours, getPhaseProgressString } from './phases.js';
import { scheduleNotificationsForFast, cancelAllNotifications } from '../notifications/notifications.js';
import { addSessionToHistory } from './sessions.js';

let timerInterval = null;

/**
 * Get active fast state from storage
 * @returns {object|null} Active fast state or null
 */
export function getActiveFastState() {
  const state = storage.getValue(COLLECTIONS.ACTIVE_FAST);
  return state ? JSON.parse(state) : null;
}

/**
 * Set active fast state
 * @param {object} state - Fast state
 */
export function setActiveFastState(state) {
  storage.setValue(COLLECTIONS.ACTIVE_FAST, JSON.stringify(state));
}

/**
 * Clear active fast state
 */
export function clearActiveFastState() {
  localStorage.removeItem(COLLECTIONS.ACTIVE_FAST);
}

/**
 * Check if fast is currently active
 * @returns {boolean}
 */
export function isFastActive() {
  const state = getActiveFastState();
  return state && state.isFastActive === true;
}

/**
 * Start a new fast
 * @param {string} protocolId - Protocol ID
 * @returns {object} Created fast state
 */
export async function startFast(protocolId) {
  if (isFastActive()) {
    const existingState = getActiveFastState();
    console.info('Fast already active');
    startTimerUpdates();
    if (window.notifyWidget) window.notifyWidget();
    return existingState;
  }

  const protocol = getProtocol(protocolId);
  const fastStartTime = new Date();
  const plannedEndTime = new Date(fastStartTime.getTime() + (protocol.fastingHours * 60 * 60 * 1000));

  const state = {
    // Unique identifiers
    fastId: generateUUID(),
    createdAt: new Date().toISOString(),
    syncStatus: 'local',
    deviceId: getDeviceId(),

    // Timer state
    isFastActive: true,
    fastStartTime: fastStartTime.toISOString(),
    plannedEndTime: plannedEndTime.toISOString(),

    // Protocol information
    protocolId: protocol.protocolId,
    protocolName: protocol.displayName,
    fastDurationHours: protocol.fastingHours,

    // Tracking flags
    hasTriggeredPlannedEndNotification: false
  };

  setActiveFastState(state);
  window.dispatchEvent(new CustomEvent('fastStateChanged', { detail: { isFasting: true } }));

  // Schedule notifications
  await scheduleNotificationsForFast(state);

  // Start timer UI updates
  startTimerUpdates();

  console.log('✅ Fast started:', protocol.displayName);
  if (window.notifyWidget) window.notifyWidget();
  return state;
}

/**
 * Stop the current fast
 * @returns {object} Completed fast session
 */
export async function stopFast() {
  const state = getActiveFastState();

  if (!state || !state.isFastActive) {
    throw new Error('No active fast to stop');
  }

  const startTime = new Date(state.fastStartTime);
  const endTime = new Date();
  const durationMs = endTime - startTime;
  const actualDurationHours = durationMs / (1000 * 60 * 60);

  // Detect deepest phase reached
  const deepestPhase = detectPhase(actualDurationHours);

  // Create completed session
  const session = {
    id: state.fastId,
    // Unique identifiers
    fastId: state.fastId,
    createdAt: state.createdAt,
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    deviceId: getDeviceId(),

    // Fast data
    date: startTime.toISOString().split('T')[0],
    startTime: state.fastStartTime,
    plannedEndTime: state.plannedEndTime,
    actualEndTime: endTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMs,
    completionReason: 'manual',
    completed: true,

    // Duration
    plannedDurationHours: state.fastDurationHours,
    actualDurationHours: Math.round(actualDurationHours * 10) / 10,

    // Protocol
    protocolId: state.protocolId,
    protocolName: state.protocolName,

    // Phase tracking
    elapsedHours: actualDurationHours,
    phaseId: deepestPhase.phaseId,
    phaseName: deepestPhase.displayTitle,
    phaseMetabolicState: deepestPhase.metabolicState,
    hadAutophagy: deepestPhase.hasAutophagy,

    // Notes
    notes: `Completed ${state.protocolName}. Reached: ${deepestPhase.displayTitle}`
  };

  console.log('✅ Session finalized:', session.fastId);
  const historySaved = addSessionToHistory(session);
  if (!historySaved) {
    console.error('❌ Fasting history write failed');
    throw new Error('Failed to save fasting history');
  }

  // Clear active fast
  clearActiveFastState();
  window.dispatchEvent(new CustomEvent('fastStateChanged', { detail: { isFasting: false } }));

  // Stop timer
  stopTimerUpdates();

  // Cancel notifications
  await cancelAllNotifications();

  console.log('✅ Fast stopped:', session.actualDurationHours, 'hours');
  if (window.notifyWidget) window.notifyWidget();
  window.dispatchEvent(new CustomEvent('fastingHistoryUpdated'));
  return session;
}

/**
 * Start timer UI updates
 */
export function startTimerUpdates() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  const state = getActiveFastState();
  if (!state) return;

  // Update immediately
  updateTimerUI(state);

  // Update every second
  timerInterval = setInterval(() => {
    const currentState = getActiveFastState();
    if (currentState && currentState.isFastActive) {
      updateTimerUI(currentState);
    } else {
      stopTimerUpdates();
    }
  }, 1000);
}

/**
 * Stop timer UI updates
 */
export function stopTimerUpdates() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Update timer UI
 * @param {object} state - Active fast state
 */
function updateTimerUI(state) {
  const now = new Date();
  const startTime = new Date(state.fastStartTime);
  const plannedEndTime = new Date(state.plannedEndTime);

  // Calculate elapsed time
  const elapsedMs = now - startTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // Check if past planned end
  const remainingToPlannedMs = plannedEndTime - now;
  const isPastPlannedEnd = remainingToPlannedMs <= 0;

  // Dispatch custom event for UI to listen to
  const timerData = {
    elapsedMs,
    elapsedHours,
    isPastPlannedEnd,
    remainingToPlannedMs,
    currentPhase: detectPhase(elapsedHours),
    phaseProgress: getPhaseProgressString(elapsedHours),
    plannedDurationHours: state.fastDurationHours
  };

  window.dispatchEvent(new CustomEvent('timerUpdate', { detail: timerData }));

  // Trigger planned end notification (once)
  if (isPastPlannedEnd && !state.hasTriggeredPlannedEndNotification) {
    state.hasTriggeredPlannedEndNotification = true;
    setActiveFastState(state);

    window.dispatchEvent(new CustomEvent('fastPlannedEndReached', {
      detail: { plannedHours: state.fastDurationHours }
    }));
  }
}

/**
 * Check for active timer on app load and resume
 */
export function checkAndResumeTimer() {
  const state = getActiveFastState();

  if (state && state.isFastActive) {
    const now = new Date();
    const plannedEndTime = new Date(state.plannedEndTime);

    // Timer continues regardless of planned end time
    startTimerUpdates();
    console.log('⏱️ Resumed active fast');
  }
}

/**
 * Get timer statistics
 * @returns {object|null} Timer stats or null
 */
export function getTimerStats() {
  const state = getActiveFastState();

  if (!state || !state.isFastActive) {
    return null;
  }

  const elapsedHours = calculateElapsedHours(state.fastStartTime);
  const currentPhase = detectPhase(elapsedHours);

  return {
    isActive: true,
    elapsedHours,
    plannedHours: state.fastDurationHours,
    currentPhase: currentPhase.displayTitle,
    protocolName: state.protocolName,
    isPastPlanned: elapsedHours > state.fastDurationHours
  };
}
