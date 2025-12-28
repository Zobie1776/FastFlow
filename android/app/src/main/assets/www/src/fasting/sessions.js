/**
 * Fasting Session History Management
 */

import { storage, COLLECTIONS } from '../state/storage.js';

const HISTORY_KEY = COLLECTIONS.FASTING_HISTORY;
const LEGACY_KEY = COLLECTIONS.FASTING_SESSIONS;

/**
 * Get all fasting sessions
 * @returns {array} Array of sessions
 */
export function getAllSessions() {
  const history = readHistory();
  return history;
}

/**
 * Get sessions sorted by date (newest first)
 * @returns {array} Sorted sessions
 */
export function getSessionsSorted() {
  return getAllSessions().sort((a, b) => {
    const aTime = new Date(a.actualEndTime || a.endTime || a.date || a.createdAt || 0).getTime();
    const bTime = new Date(b.actualEndTime || b.endTime || b.date || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

/**
 * Get session by ID
 * @param {string} fastId - Fast ID
 * @returns {object|null} Session or null
 */
export function getSessionById(fastId) {
  const sessions = getAllSessions();
  return sessions.find(s => s.fastId === fastId) || null;
}

/**
 * Delete session
 * @param {string} fastId - Fast ID
 * @returns {boolean} Success status
 */
export function deleteSession(fastId) {
  return storage.delete(HISTORY_KEY, fastId);
}

/**
 * Get fasting statistics
 * @returns {object} Statistics
 */
export function getFastingStats() {
  const sessions = getAllSessions();

  if (sessions.length === 0) {
    return {
      totalFasts: 0,
      totalHours: 0,
      averageHours: 0,
      longestFast: 0,
      currentStreak: 0
    };
  }

  const totalHours = sessions.reduce((sum, s) => sum + s.actualDurationHours, 0);
  const averageHours = totalHours / sessions.length;
  const longestFast = Math.max(...sessions.map(s => s.actualDurationHours));

  // Calculate current streak
  const streak = calculateStreak(sessions);

  return {
    totalFasts: sessions.length,
    totalHours: Math.round(totalHours * 10) / 10,
    averageHours: Math.round(averageHours * 10) / 10,
    longestFast: Math.round(longestFast * 10) / 10,
    currentStreak: streak
  };
}

/**
 * Add completed fasting session to history (no duplicates)
 * @param {object} session - Completed session object
 * @returns {boolean} True if saved or already exists
 */
export function addSessionToHistory(session) {
  const history = readHistory();
  const exists = history.some(item => item.id === session.id || item.fastId === session.fastId);
  if (exists) {
    console.info('ℹ️ Fasting history already contains this session');
    return true;
  }

  history.push(session);
  writeHistory(history);
  console.log('✅ Fasting history write succeeded');
  return true;
}

/**
 * Calculate fasting streak (consecutive days with fasts)
 * @param {array} sessions - Fasting sessions
 * @returns {number} Streak in days
 */
function calculateStreak(sessions) {
  if (sessions.length === 0) return 0;

  const sorted = sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

  let streak = 1;
  let currentDate = new Date(sorted[0].date);

  for (let i = 1; i < sorted.length; i++) {
    const sessionDate = new Date(sorted[i].date);
    const dayDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
      currentDate = sessionDate;
    } else if (dayDiff > 1) {
      break;
    }
  }

  return streak;
}

function readHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        console.log('✅ Fasting history load succeeded');
        return parsed;
      }
    }
  } catch (error) {
    console.error('❌ Error loading fasting history:', error);
  }

  const legacy = storage.get(LEGACY_KEY);
  if (legacy.length) {
    console.log('✅ Migrating legacy fasting sessions into history');
    writeHistory(legacy);
    return legacy;
  }

  console.log('✅ Fasting history load succeeded (empty)');
  return [];
}

function writeHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('❌ Error saving fasting history:', error);
  }
}

/**
 * Get sessions by protocol
 * @param {string} protocolId - Protocol ID
 * @returns {array} Filtered sessions
 */
export function getSessionsByProtocol(protocolId) {
  return getAllSessions().filter(s => s.protocolId === protocolId);
}

/**
 * Get sessions by date range
 * @param {string} startDate - Start date (ISO)
 * @param {string} endDate - End date (ISO)
 * @returns {array} Filtered sessions
 */
export function getSessionsByDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return getAllSessions().filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= start && sessionDate <= end;
  });
}
