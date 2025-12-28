/**
 * Body Stats Tracking Module
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { generateUUID, getDeviceId } from '../state/device.js';
import { checkAndAwardBadges } from '../badges/badges.js';

const DEFAULT_WEIGHT_UNIT = 'lb';
const LB_PER_KG = 2.20462;

export function getBodyStats() {
  return storage.get(COLLECTIONS.BODY_STATS);
}

export function getWeightUnit() {
  return storage.getValue(COLLECTIONS.WEIGHT_UNIT) || DEFAULT_WEIGHT_UNIT;
}

export function setWeightUnit(unit) {
  storage.setValue(COLLECTIONS.WEIGHT_UNIT, unit);
}

export function getGoalWeight() {
  const stored = storage.getValue(COLLECTIONS.GOAL_WEIGHT);
  const parsed = stored ? parseFloat(stored) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function setGoalWeight(weightLb) {
  if (!Number.isFinite(weightLb) || weightLb <= 0) {
    storage.setValue(COLLECTIONS.GOAL_WEIGHT, '');
    return;
  }
  storage.setValue(COLLECTIONS.GOAL_WEIGHT, String(weightLb));
}

export function addBodyStat(entry) {
  const stat = {
    statId: generateUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    deviceId: getDeviceId(),
    date: entry.date || new Date().toISOString().split('T')[0],
    weight: parseFloat(entry.weight) || null,
    waist: entry.waist ? parseFloat(entry.waist) : null,
    chest: entry.chest ? parseFloat(entry.chest) : null,
    hips: entry.hips ? parseFloat(entry.hips) : null,
    arms: entry.arms ? parseFloat(entry.arms) : null,
    thighs: entry.thighs ? parseFloat(entry.thighs) : null,
    bodyFatPercentage: entry.bodyFatPercentage ? parseFloat(entry.bodyFatPercentage) : null,
    muscleMass: entry.muscleMass ? parseFloat(entry.muscleMass) : null,
    notes: entry.notes || '',
    energy: entry.energy || null,
    mood: entry.mood || null,
    photoUrls: entry.photoUrls || []
  };

  storage.add(COLLECTIONS.BODY_STATS, stat);
  checkAndAwardBadges('stat_logged', stat);

  // FIX 2: Emit event when body stat is added so graph can update
  window.dispatchEvent(new CustomEvent('bodyStatsUpdated', { detail: { action: 'added', stat } }));

  return stat;
}

export function deleteBodyStat(statId) {
  const result = storage.delete(COLLECTIONS.BODY_STATS, statId);

  // FIX 2: Emit event when body stat is deleted so graph can update
  window.dispatchEvent(new CustomEvent('bodyStatsUpdated', { detail: { action: 'deleted', statId } }));

  return result;
}

export function getWeightProgressData() {
  const stats = getBodyStats()
    .filter(s => s.weight !== null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    labels: stats.map(s => s.date),
    weights: stats.map(s => s.weight),
    dates: stats.map(s => s.date)
  };
}

export function getWeightChangeStats() {
  const stats = getBodyStats()
    .filter(s => s.weight !== null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (stats.length === 0) {
    return { startWeight: null, currentWeight: null, change: null, percentChange: null };
  }

  const startWeight = stats[0].weight;
  const currentWeight = stats[stats.length - 1].weight;
  const change = currentWeight - startWeight;
  const percentChange = ((change / startWeight) * 100).toFixed(1);

  return {
    startWeight,
    currentWeight,
    change: change.toFixed(1),
    percentChange,
    direction: change < 0 ? 'loss' : change > 0 ? 'gain' : 'maintained',
    totalEntries: stats.length,
    firstEntry: stats[0].date,
    latestEntry: stats[stats.length - 1].date
  };
}

export function convertToLb(value, unit) {
  if (!Number.isFinite(value)) return null;
  return unit === 'kg' ? value * LB_PER_KG : value;
}

export function convertFromLb(value, unit) {
  if (!Number.isFinite(value)) return null;
  return unit === 'kg' ? value / LB_PER_KG : value;
}
