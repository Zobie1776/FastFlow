/**
 * Fasting Protocol Definitions
 *
 * CRITICAL: maxGuidedHours is for UI/notifications ONLY
 * Timer NEVER stops automatically - user must manually stop
 */

export const FASTING_PROTOCOLS = {
  '8_16': {
    protocolId: '8_16',
    displayName: '8 / 16',
    description: 'Beginner: 8 hours fasting, 16 hours eating',
    fastingHours: 8,
    eatingHours: 16,
    maxGuidedHours: 8,
    beginnerFriendly: true,
    educationCategory: 'beginner',
    educationOrder: 1,
    category: 'foundational',
    recommendedFor: 'New to fasting, building consistency, gentle introduction to time-restricted eating',
    notificationOffset: 2,
    isDefault: true
  },
  '10_14': {
    protocolId: '10_14',
    displayName: '10 / 14',
    description: 'Beginner: 10 hours fasting, 14 hours eating',
    fastingHours: 10,
    eatingHours: 14,
    maxGuidedHours: 10,
    beginnerFriendly: true,
    educationCategory: 'beginner',
    educationOrder: 2,
    category: 'foundational',
    recommendedFor: 'Building fasting capacity',
    notificationOffset: 1,
    isDefault: false
  },
  '12_12': {
    protocolId: '12_12',
    displayName: '12 / 12',
    description: 'Beginner: 12 hours fasting, 12 hours eating',
    fastingHours: 12,
    eatingHours: 12,
    maxGuidedHours: 12,
    beginnerFriendly: true,
    educationCategory: 'beginner',
    educationOrder: 3,
    category: 'foundational',
    recommendedFor: 'Complete beginners, metabolic conditioning',
    notificationOffset: 1,
    isDefault: false
  },
  '14_10': {
    protocolId: '14_10',
    displayName: '14 / 10',
    description: 'Intermediate: 14 hours fasting, 10 hours eating',
    fastingHours: 14,
    eatingHours: 10,
    maxGuidedHours: 14,
    beginnerFriendly: false,
    educationCategory: 'intermediate',
    educationOrder: 4,
    category: 'intermediate',
    recommendedFor: 'Early fat adaptation',
    notificationOffset: 1,
    isDefault: false
  },
  '16_8': {
    protocolId: '16_8',
    displayName: '16 / 8',
    description: 'Intermediate: 16 hours fasting, 8 hours eating',
    fastingHours: 16,
    eatingHours: 8,
    maxGuidedHours: 16,
    beginnerFriendly: false,
    educationCategory: 'intermediate',
    educationOrder: 5,
    category: 'intermediate',
    recommendedFor: 'Established fasters, optimizing fat burning, ketone production, daily routine',
    notificationOffset: 2,
    isDefault: false
  },
  '18_6': {
    protocolId: '18_6',
    displayName: '18 / 6',
    description: 'Advanced: 18 hours fasting, 6 hours eating',
    fastingHours: 18,
    eatingHours: 6,
    maxGuidedHours: 18,
    beginnerFriendly: false,
    educationCategory: 'advanced',
    educationOrder: 6,
    category: 'advanced',
    recommendedFor: 'Deep ketosis, autophagy benefits',
    notificationOffset: 2,
    isDefault: false
  },
  '20_4': {
    protocolId: '20_4',
    displayName: '20 / 4',
    description: 'Advanced: 20 hours fasting, 4 hours eating',
    fastingHours: 20,
    eatingHours: 4,
    maxGuidedHours: 20,
    beginnerFriendly: false,
    educationCategory: 'advanced',
    educationOrder: 7,
    category: 'advanced',
    recommendedFor: 'Advanced fasters, warrior diet style',
    notificationOffset: 2,
    isDefault: false
  },
  '24_plus': {
    protocolId: '24_plus',
    displayName: '24+',
    description: 'Extended: 24+ hours fasting',
    fastingHours: 24,
    eatingHours: null,
    maxGuidedHours: 48,
    beginnerFriendly: false,
    educationCategory: 'extended',
    educationOrder: 8,
    category: 'advanced',
    recommendedFor: 'Extended fasts, autophagy, regeneration',
    notificationOffset: 4,
    requiresMedicalGuidance: true,
    isDefault: false
  },
  'custom': {
    protocolId: 'custom',
    displayName: 'Custom',
    description: 'Set your own fasting schedule',
    fastingHours: null,
    eatingHours: null,
    maxGuidedHours: null,
    beginnerFriendly: false,
    category: 'custom',
    recommendedFor: 'Flexible fasting, maintenance mode',
    notificationOffset: 0,
    isDefault: false
  }
};

/**
 * Get protocol by ID with fallback to default
 * @param {string} protocolId - Protocol ID
 * @returns {object} Protocol configuration
 */
export function getProtocol(protocolId) {
  return FASTING_PROTOCOLS[protocolId] || FASTING_PROTOCOLS['8_16'];
}

/**
 * Get default protocol
 * @returns {object} Default protocol
 */
export function getDefaultProtocol() {
  return FASTING_PROTOCOLS['8_16'];
}

/**
 * Get beginner-friendly protocols
 * @returns {array} Beginner protocols
 */
export function getBeginnerProtocols() {
  return Object.values(FASTING_PROTOCOLS).filter(p => p.beginnerFriendly);
}

/**
 * Get advanced protocols
 * @returns {array} Advanced protocols
 */
export function getAdvancedProtocols() {
  return Object.values(FASTING_PROTOCOLS).filter(
    p => !p.beginnerFriendly && p.protocolId !== 'custom'
  );
}

/**
 * Get all protocols as array
 * @returns {array} All protocols
 */
export function getAllProtocols() {
  return Object.values(FASTING_PROTOCOLS);
}

/**
 * NEW: Validate protocol configuration
 * Ensures eatingHours + fastingHours = 24
 * @param {object} protocol - Protocol to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateProtocol(protocol) {
  // Skip validation for custom and 24_plus protocols
  if (protocol.protocolId === 'custom' || protocol.protocolId === '24_plus') {
    return true;
  }

  // Check that both values exist
  if (protocol.eatingHours === null || protocol.fastingHours === null) {
    console.error(`Protocol ${protocol.protocolId}: Missing eating or fasting hours`);
    return false;
  }

  // Check that they sum to 24
  const total = protocol.eatingHours + protocol.fastingHours;
  if (total !== 24) {
    console.error(`Protocol ${protocol.protocolId}: eatingHours (${protocol.eatingHours}) + fastingHours (${protocol.fastingHours}) = ${total}, expected 24`);
    return false;
  }

  return true;
}

/**
 * NEW: Validate all protocols on module load
 */
export function validateAllProtocols() {
  const protocols = getAllProtocols();
  let allValid = true;

  protocols.forEach(protocol => {
    if (!validateProtocol(protocol)) {
      allValid = false;
    }
  });

  if (allValid) {
    console.log('✅ All protocols validated successfully');
  } else {
    console.warn('⚠️ Some protocols failed validation');
  }

  return allValid;
}

// Auto-validate on module load
validateAllProtocols();
