/**
 * Local Storage Wrapper with Cloud-Sync Ready Schemas
 *
 * All data includes:
 * - UUID identifiers
 * - Created/updated timestamps
 * - Sync status tracking
 * - Device identification
 */

const STORAGE_VERSION = '1.0.0';

/**
 * Generic storage interface
 */
export const storage = {
  /**
   * Get items from a collection
   * @param {string} key - Collection name
   * @returns {array} Array of items
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return [];
    }
  },

  /**
   * Save entire collection
   * @param {string} key - Collection name
   * @param {array} data - Data array
   */
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },

  /**
   * Add item to collection
   * @param {string} key - Collection name
   * @param {object} item - Item to add
   */
  add(key, item) {
    const items = this.get(key);
    items.push(item);
    this.set(key, items);
  },

  /**
   * Update item in collection by ID
   * @param {string} key - Collection name
   * @param {string} id - Item ID
   * @param {object} updates - Fields to update
   * @returns {boolean} Success status
   */
  update(key, id, updates) {
    const items = this.get(key);
    const index = items.findIndex(item => item.id === id || item.statId === id || item.fastId === id);

    if (index === -1) return false;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.set(key, items);
    return true;
  },

  /**
   * Delete item from collection
   * @param {string} key - Collection name
   * @param {string} id - Item ID
   * @returns {boolean} Success status
   */
  delete(key, id) {
    const items = this.get(key);
    const filtered = items.filter(item =>
      item.id !== id && item.statId !== id && item.fastId !== id
    );

    if (filtered.length === items.length) return false;

    this.set(key, filtered);
    return true;
  },

  /**
   * Clear entire collection
   * @param {string} key - Collection name
   */
  clear(key) {
    localStorage.removeItem(key);
  },

  /**
   * Get single value
   * @param {string} key - Key name
   * @returns {string|null} Value
   */
  getValue(key) {
    return localStorage.getItem(key);
  },

  /**
   * Set single value
   * @param {string} key - Key name
   * @param {string} value - Value
   */
  setValue(key, value) {
    localStorage.setItem(key, value);
  }
};

/**
 * Collection names
 */
export const COLLECTIONS = {
  FASTING_SESSIONS: 'fastingSessions',
  FASTING_HISTORY: 'fastflow_fasting_history',
  WATER_LOGS: 'fastflow_water_logs',
  WATER_GOAL: 'dailyWaterGoalMl',
  WATER_UNIT: 'userPreferredWaterUnit',
  WEIGHT_UNIT: 'weightUnit',
  ACTIVE_FAST: 'activeFast',
  BODY_STATS: 'bodyStats',
  MEALS: 'meals',
  MEAL_LOGS: 'mealLogs',
  EXERCISES: 'exercises',
  WORKOUTS: 'workouts',
  BADGES: 'unlockedBadges',
  MAINTENANCE_STATE: 'maintenanceMode',
  NOTIFICATION_PREFS: 'notificationPreferences',
  SELECTED_PROTOCOL: 'selectedProtocol',
  GOAL_WEIGHT: 'goalWeight',
  DEVICE_ID: 'deviceId',
  APP_VERSION: 'appVersion'
};

/**
 * Initialize storage with defaults
 */
export function initializeStorage() {
  // Initialize collections if they don't exist
  const collections = [
    COLLECTIONS.FASTING_SESSIONS,
    COLLECTIONS.FASTING_HISTORY,
    COLLECTIONS.BODY_STATS,
    COLLECTIONS.MEALS,
    COLLECTIONS.MEAL_LOGS,
    COLLECTIONS.EXERCISES,
    COLLECTIONS.WORKOUTS,
    COLLECTIONS.BADGES
  ];

  collections.forEach(collection => {
    if (!storage.get(collection)) {
      storage.set(collection, []);
    }
  });

  // Set app version
  if (!storage.getValue(COLLECTIONS.APP_VERSION)) {
    storage.setValue(COLLECTIONS.APP_VERSION, STORAGE_VERSION);
  }

  // Initialize default notification preferences
  if (!storage.getValue(COLLECTIONS.NOTIFICATION_PREFS)) {
    const defaultPrefs = {
      fastEnding: true,
      waterReminders: true,
      phaseTransitions: false,
      badges: true,
      waterIntervalMinutes: 60
    };
    storage.setValue(COLLECTIONS.NOTIFICATION_PREFS, JSON.stringify(defaultPrefs));
  }

  // Initialize default protocol
  if (!storage.getValue(COLLECTIONS.SELECTED_PROTOCOL)) {
    storage.setValue(COLLECTIONS.SELECTED_PROTOCOL, '8_16');
  }

  console.log('✅ Storage initialized');
}

/**
 * Export all data (for backup)
 * @returns {object} Complete data export
 */
export function exportAllData() {
  const data = {
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    fastingHistory: storage.get(COLLECTIONS.FASTING_HISTORY),
    fastingSessions: storage.get(COLLECTIONS.FASTING_SESSIONS),
    bodyStats: storage.get(COLLECTIONS.BODY_STATS),
    meals: storage.get(COLLECTIONS.MEALS),
    exercises: storage.get(COLLECTIONS.EXERCISES),
    workouts: storage.get(COLLECTIONS.WORKOUTS),
    badges: storage.get(COLLECTIONS.BADGES),
    maintenanceState: JSON.parse(storage.getValue(COLLECTIONS.MAINTENANCE_STATE) || 'null'),
    goalWeight: storage.getValue(COLLECTIONS.GOAL_WEIGHT),
    weightUnit: storage.getValue(COLLECTIONS.WEIGHT_UNIT),
    selectedProtocol: storage.getValue(COLLECTIONS.SELECTED_PROTOCOL)
  };

  return data;
}

/**
 * Import data (from backup)
 * @param {object} data - Data to import
 * @returns {boolean} Success status
 */
export function importAllData(data) {
  try {
    if (data.fastingHistory) storage.set(COLLECTIONS.FASTING_HISTORY, data.fastingHistory);
    if (data.fastingSessions) {
      storage.set(COLLECTIONS.FASTING_SESSIONS, data.fastingSessions);
      if (!data.fastingHistory) {
        storage.set(COLLECTIONS.FASTING_HISTORY, data.fastingSessions);
      }
    }
    if (data.bodyStats) storage.set(COLLECTIONS.BODY_STATS, data.bodyStats);
    if (data.meals) storage.set(COLLECTIONS.MEALS, data.meals);
    if (data.exercises) storage.set(COLLECTIONS.EXERCISES, data.exercises);
    if (data.workouts) storage.set(COLLECTIONS.WORKOUTS, data.workouts);
    if (data.badges) storage.set(COLLECTIONS.BADGES, data.badges);
    if (data.maintenanceState) storage.setValue(COLLECTIONS.MAINTENANCE_STATE, JSON.stringify(data.maintenanceState));
    if (data.goalWeight) storage.setValue(COLLECTIONS.GOAL_WEIGHT, data.goalWeight);
    if (data.weightUnit) storage.setValue(COLLECTIONS.WEIGHT_UNIT, data.weightUnit);
    if (data.selectedProtocol) storage.setValue(COLLECTIONS.SELECTED_PROTOCOL, data.selectedProtocol);

    console.log('✅ Data imported successfully');
    return true;
  } catch (error) {
    console.error('❌ Error importing data:', error);
    return false;
  }
}
