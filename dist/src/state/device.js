/**
 * Device Identification for Multi-Device Cloud Sync Support
 */

import { storage, COLLECTIONS } from './storage.js';

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create device ID
 * @returns {string} Device ID
 */
export function getDeviceId() {
  let deviceId = storage.getValue(COLLECTIONS.DEVICE_ID);

  if (!deviceId) {
    deviceId = generateUUID();
    storage.setValue(COLLECTIONS.DEVICE_ID, deviceId);
    console.log('📱 New device ID generated:', deviceId);
  }

  return deviceId;
}
