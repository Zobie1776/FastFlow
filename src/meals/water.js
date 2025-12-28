/**
 * Water Intake Tracking (Meals Module)
 */

import { storage, COLLECTIONS } from '../state/storage.js';

const DEFAULT_GOAL_ML = 2700;
const DEFAULT_UNIT = 'ml';

export function getPreferredWaterUnit() {
  return storage.getValue(COLLECTIONS.WATER_UNIT) || DEFAULT_UNIT;
}

export function setPreferredWaterUnit(unit) {
  storage.setValue(COLLECTIONS.WATER_UNIT, unit);
}

export function getDailyWaterGoalMl() {
  const stored = storage.getValue(COLLECTIONS.WATER_GOAL);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GOAL_ML;
}

export function setDailyWaterGoalMl(goalMl) {
  storage.setValue(COLLECTIONS.WATER_GOAL, String(goalMl));
}

export function getTodayWaterLog() {
  const today = new Date().toISOString().split('T')[0];
  const logs = getWaterLogs();

  if (!logs[today]) {
    logs[today] = { date: today, totalMl: 0, entries: [] };
    setWaterLogs(logs);
  }

  return logs[today];
}

export function addWaterEntry(amountMl) {
  const log = getTodayWaterLog();
  log.entries.push({ amountMl, timestamp: new Date().toISOString() });
  log.totalMl += amountMl;

  const logs = getWaterLogs();
  logs[log.date] = log;
  setWaterLogs(logs);
}

function getWaterLogs() {
  try {
    const data = storage.getValue(COLLECTIONS.WATER_LOGS);
    const parsed = data ? JSON.parse(data) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Error reading water logs:', error);
    return {};
  }
}

function setWaterLogs(logs) {
  storage.setValue(COLLECTIONS.WATER_LOGS, JSON.stringify(logs));
}
