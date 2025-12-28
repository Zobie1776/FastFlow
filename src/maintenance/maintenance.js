/**
 * Maintenance Mode System
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { checkAndAwardBadges } from '../badges/badges.js';

export const MAINTENANCE_MODE_CONFIG = {
  recommendedProtocols: ['10_14', '12_12', '14_10', '8_16', 'custom'],
  notificationFrequency: 'reduced',
  waterReminderIntervalMinutes: 120,
  phaseTransitionNotifications: false,
  badgeUnlockNotifications: true,
  minFastingHoursRecommended: 12,
  maxFastingHoursRecommended: 16,
  flexibilityMessage: 'Flexibility is key in maintenance. Listen to your body.'
};

export function getMaintenanceState() {
  const state = storage.getValue(COLLECTIONS.MAINTENANCE_STATE);
  if (!state) {
    return {
      isActive: false,
      activatedAt: null,
      deactivatedAt: null,
      activationCount: 0,
      reason: null,
      goalWeight: null,
      currentWeight: null,
      notes: ''
    };
  }
  return JSON.parse(state);
}

export function setMaintenanceState(state) {
  storage.setValue(COLLECTIONS.MAINTENANCE_STATE, JSON.stringify(state));
}

export function isMaintenanceModeActive() {
  return getMaintenanceState().isActive === true;
}

export function activateMaintenanceMode(options = {}) {
  const currentState = getMaintenanceState();

  if (currentState.isActive) return;

  const newState = {
    isActive: true,
    activatedAt: new Date().toISOString(),
    deactivatedAt: null,
    activationCount: currentState.activationCount + 1,
    reason: options.reason || 'manual',
    goalWeight: options.goalWeight || null,
    currentWeight: options.currentWeight || null,
    notes: options.notes || ''
  };

  setMaintenanceState(newState);
  checkAndAwardBadges('maintenance_activated');

  window.dispatchEvent(new CustomEvent('maintenanceModeChanged', { detail: { active: true } }));
}

export function deactivateMaintenanceMode(options = {}) {
  const currentState = getMaintenanceState();

  if (!currentState.isActive) return;

  currentState.isActive = false;
  currentState.deactivatedAt = new Date().toISOString();
  if (options.notes) {
    currentState.notes += `\nDeactivated: ${options.notes}`;
  }

  setMaintenanceState(currentState);

  window.dispatchEvent(new CustomEvent('maintenanceModeChanged', { detail: { active: false } }));
}

export function toggleMaintenanceMode() {
  if (isMaintenanceModeActive()) {
    deactivateMaintenanceMode({ notes: 'Toggled off by user' });
  } else {
    activateMaintenanceMode({ reason: 'manual', notes: 'Activated by user' });
  }
}

export function getRecommendedProtocols() {
  if (isMaintenanceModeActive()) {
    return MAINTENANCE_MODE_CONFIG.recommendedProtocols;
  }

  // Return progressive recommendations based on history
  return ['8_16', '16_8', '18_6'];
}

export function getMaintenanceModeStatusMessage() {
  if (!isMaintenanceModeActive()) return null;

  const state = getMaintenanceState();
  const activatedDate = new Date(state.activatedAt);
  const daysActive = Math.floor((new Date() - activatedDate) / (1000 * 60 * 60 * 24));

  return `Maintenance Mode Active (${daysActive} days) • ${MAINTENANCE_MODE_CONFIG.flexibilityMessage}`;
}
