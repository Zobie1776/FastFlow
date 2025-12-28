/**
 * Metabolic Phase Definitions (4-Hour Increments)
 *
 * Phases are detected based solely on elapsed fasting time
 * Detection continues regardless of selected protocol
 */

export const FASTING_PHASES = [
  {
    phaseId: 'fed_state',
    startHour: 0,
    endHour: 4,
    displayTitle: 'Fed State',
    shortSummary: 'Body actively digesting food and storing energy',
    metabolicState: 'Storage mode - insulin elevated, fat storage active',
    isFoundational: true,
    isAdvanced: false,
    hasAutophagy: false,
    educationalContentSlot: 'CONTENT_FED_STATE',
    slideColor: '#e0f2fe',
    slideIcon: '🍽️'
  },
  {
    phaseId: 'post_absorptive',
    startHour: 4,
    endHour: 8,
    displayTitle: 'Post-Absorptive',
    shortSummary: 'Digestion complete, transitioning to stored energy',
    metabolicState: 'Early transition - insulin declining, glucagon rising',
    isFoundational: true,
    isAdvanced: false,
    hasAutophagy: false,
    educationalContentSlot: 'CONTENT_POST_ABSORPTIVE',
    slideColor: '#dbeafe',
    slideIcon: '⏳'
  },
  {
    phaseId: 'insulin_decline',
    startHour: 8,
    endHour: 12,
    displayTitle: 'Insulin Decline',
    shortSummary: 'Insulin drops, fat burning begins',
    metabolicState: 'Fat mobilization starting - glycogen still primary fuel',
    isFoundational: true,
    isAdvanced: false,
    hasAutophagy: false,
    educationalContentSlot: 'CONTENT_INSULIN_DECLINE',
    slideColor: '#bfdbfe',
    slideIcon: '📉'
  },
  {
    phaseId: 'glycogen_utilization',
    startHour: 12,
    endHour: 16,
    displayTitle: 'Glycogen Utilization',
    shortSummary: 'Liver glycogen actively depleting',
    metabolicState: 'Glycogen depletion accelerating - ketone production beginning',
    isFoundational: true,
    isAdvanced: false,
    hasAutophagy: false,
    educationalContentSlot: 'CONTENT_GLYCOGEN_UTIL',
    slideColor: '#93c5fd',
    slideIcon: '🔋'
  },
  {
    phaseId: 'glycogen_waning',
    startHour: 16,
    endHour: 20,
    displayTitle: 'Glycogen Waning',
    shortSummary: 'Glycogen nearly depleted, ketones rising',
    metabolicState: 'Ketone transition - fat becoming primary fuel',
    isFoundational: false,
    isAdvanced: true,
    hasAutophagy: true,
    educationalContentSlot: 'CONTENT_GLYCOGEN_WANING',
    slideColor: '#fef3c7',
    slideIcon: '🔥'
  },
  {
    phaseId: 'early_ketosis',
    startHour: 20,
    endHour: 24,
    displayTitle: 'Early Ketosis',
    shortSummary: 'Entering ketosis, fat-dominant metabolism',
    metabolicState: 'Ketosis establishing - brain using ketones for fuel',
    isFoundational: false,
    isAdvanced: true,
    hasAutophagy: true,
    educationalContentSlot: 'CONTENT_EARLY_KETOSIS',
    slideColor: '#fde68a',
    slideIcon: '✨'
  },
  {
    phaseId: 'established_ketosis',
    startHour: 24,
    endHour: 48,
    displayTitle: 'Established Ketosis',
    shortSummary: 'Deep ketosis, autophagy active',
    metabolicState: 'Full ketosis - autophagy intensifying, cellular cleanup active',
    isFoundational: false,
    isAdvanced: true,
    hasAutophagy: true,
    educationalContentSlot: 'CONTENT_ESTABLISHED_KETOSIS',
    slideColor: '#fbbf24',
    slideIcon: '🧬'
  },
  {
    phaseId: 'extended_fasting',
    startHour: 48,
    endHour: 72,
    displayTitle: 'Extended Fasting',
    shortSummary: 'Deep autophagy, immune renewal',
    metabolicState: 'Stem cell activation, immune system regeneration',
    isFoundational: false,
    isAdvanced: true,
    hasAutophagy: true,
    requiresMedicalGuidance: true,
    educationalContentSlot: 'CONTENT_EXTENDED_FASTING',
    slideColor: '#fed7aa',
    slideIcon: '⚠️'
  },
  {
    phaseId: 'regenerative',
    startHour: 72,
    endHour: Infinity,
    displayTitle: 'Regenerative (72+ hours)',
    shortSummary: 'Multi-day fasting, deep cellular renewal',
    metabolicState: 'Advanced regenerative state - medical supervision required',
    isFoundational: false,
    isAdvanced: true,
    hasAutophagy: true,
    requiresMedicalGuidance: true,
    educationalContentSlot: 'CONTENT_REGENERATIVE',
    slideColor: '#fdba74',
    slideIcon: '⚠️'
  }
];

/**
 * Detect current fasting phase based on elapsed hours
 * @param {number} elapsedHours - Hours since fast started
 * @returns {object} Phase configuration
 */
export function detectPhase(elapsedHours) {
  for (let phase of FASTING_PHASES) {
    if (elapsedHours >= phase.startHour && elapsedHours < phase.endHour) {
      return phase;
    }
  }
  // If beyond all ranges, return last phase
  return FASTING_PHASES[FASTING_PHASES.length - 1];
}

/**
 * Get phase index in array
 * @param {number} elapsedHours - Hours since fast started
 * @returns {number} Phase index
 */
export function getPhaseIndex(elapsedHours) {
  const phase = detectPhase(elapsedHours);
  return FASTING_PHASES.findIndex(p => p.phaseId === phase.phaseId);
}

/**
 * Calculate elapsed hours from start time
 * @param {string|Date} startTime - Fast start time
 * @returns {number} Elapsed hours
 */
export function calculateElapsedHours(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const elapsedMs = now - start;
  return elapsedMs / (1000 * 60 * 60);
}

/**
 * Get human-readable phase progress
 * @param {number} elapsedHours - Hours since fast started
 * @returns {string} Progress string
 */
export function getPhaseProgressString(elapsedHours) {
  const currentPhase = detectPhase(elapsedHours);
  const currentIndex = getPhaseIndex(elapsedHours);
  const totalPhases = FASTING_PHASES.length;

  return `Phase ${currentIndex + 1} of ${totalPhases} • ${currentPhase.displayTitle}`;
}
