/**
 * Badge & Achievement System
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { getAllSessions } from '../fasting/sessions.js';

export const BADGE_DEFINITIONS = {
  // Fasting Milestones
  first_fast: { badgeId: 'first_fast', category: 'milestone', displayName: 'First Fast', description: 'Completed your first fasting session', icon: '🌟' },
  protocol_10_14: { badgeId: 'protocol_10_14', category: 'milestone', displayName: '10/14 Completed', description: 'Completed a 10/14 protocol', icon: '⏰' },
  protocol_12_12: { badgeId: 'protocol_12_12', category: 'milestone', displayName: '12/12 Completed', description: 'Completed a 12/12 protocol', icon: '🕐' },
  protocol_14_10: { badgeId: 'protocol_14_10', category: 'milestone', displayName: '14/10 Completed', description: 'Completed a 14/10 protocol', icon: '🕑' },
  protocol_8_16: { badgeId: 'protocol_8_16', category: 'milestone', displayName: '8/16 Completed', description: 'Completed the popular 8/16 protocol', icon: '⭐' },
  protocol_16_8: { badgeId: 'protocol_16_8', category: 'milestone', displayName: '16/8 Advanced', description: 'Completed an advanced 16/8 protocol', icon: '🔥' },
  protocol_18_6: { badgeId: 'protocol_18_6', category: 'milestone', displayName: '18/6 Master', description: 'Completed an 18/6 protocol', icon: '💪' },
  protocol_20_4: { badgeId: 'protocol_20_4', category: 'milestone', displayName: '20/4 Warrior', description: 'Completed a 20/4 protocol', icon: '⚔️' },
  protocol_24_plus: { badgeId: 'protocol_24_plus', category: 'milestone', displayName: '24+ Extended', description: 'Completed a 24+ hour fast', icon: '🏆' },

  // Consistency
  streak_7: { badgeId: 'streak_7', category: 'consistency', displayName: '7-Day Streak', description: 'Fasted for 7 consecutive days', icon: '📅' },
  streak_14: { badgeId: 'streak_14', category: 'consistency', displayName: '14-Day Streak', description: 'Fasted for 14 consecutive days', icon: '🗓️' },
  streak_30: { badgeId: 'streak_30', category: 'consistency', displayName: '30-Day Streak', description: 'Fasted for 30 consecutive days', icon: '📆' },
  progression_complete: { badgeId: 'progression_complete', category: 'consistency', displayName: 'Progression Master', description: 'Completed all beginner protocols', icon: '🎓' },
  maintenance_mode: { badgeId: 'maintenance_mode', category: 'consistency', displayName: 'Maintenance Mode', description: 'Entered maintenance mode', icon: '🔄' },

  // Nutrition
  meals_5: { badgeId: 'meals_5', category: 'nutrition', displayName: 'Meal Explorer', description: 'Logged 5 unique meals', icon: '🍽️' },
  meals_10: { badgeId: 'meals_10', category: 'nutrition', displayName: 'Recipe Collector', description: 'Logged 10 unique meals', icon: '📋' },
  meals_20: { badgeId: 'meals_20', category: 'nutrition', displayName: 'Culinary Expert', description: 'Logged 20 unique meals', icon: '👨‍🍳' },
  diversity_5: { badgeId: 'diversity_5', category: 'nutrition', displayName: 'Variety Starter', description: 'Logged 5 unique meals for consumption', icon: '🌈' },
  diversity_10: { badgeId: 'diversity_10', category: 'nutrition', displayName: 'Diversity Master', description: 'Logged 10 unique meals for consumption', icon: '🎨' },
  diversity_20: { badgeId: 'diversity_20', category: 'nutrition', displayName: 'Nutrition Rainbow', description: 'Logged 20 unique meals for consumption', icon: '🦚' },
  variety_streak_7: { badgeId: 'variety_streak_7', category: 'nutrition', displayName: 'Variety Week', description: '7 days with 2+ unique meals per day', icon: '🌟' },

  // NEW: Exercise Consistency
  first_workout: { badgeId: 'first_workout', category: 'exercise', displayName: 'First Workout', description: 'Logged your first workout', icon: '🏃' },
  workout_streak_3: { badgeId: 'workout_streak_3', category: 'exercise', displayName: '3-Day Workout Streak', description: 'Worked out 3 consecutive days', icon: '🔥' },
  workout_streak_7: { badgeId: 'workout_streak_7', category: 'exercise', displayName: '7-Day Workout Streak', description: 'Worked out 7 consecutive days', icon: '💪' },
  workout_streak_14: { badgeId: 'workout_streak_14', category: 'exercise', displayName: '14-Day Workout Streak', description: 'Worked out 14 consecutive days', icon: '⚡' },
  workout_streak_30: { badgeId: 'workout_streak_30', category: 'exercise', displayName: '30-Day Workout Streak', description: 'Worked out 30 consecutive days', icon: '🏆' },

  // Body Goals
  first_stat: { badgeId: 'first_stat', category: 'body_goals', displayName: 'First Measurement', description: 'Logged your first body stat', icon: '📊' },
  weight_milestone_5: { badgeId: 'weight_milestone_5', category: 'body_goals', displayName: '5 Milestone', description: 'Lost 5 units', icon: '📉' },
  weight_milestone_10: { badgeId: 'weight_milestone_10', category: 'body_goals', displayName: '10 Milestone', description: 'Lost 10 units', icon: '🎯' },
  weight_milestone_20: { badgeId: 'weight_milestone_20', category: 'body_goals', displayName: '20 Milestone', description: 'Lost 20 units', icon: '🏅' },
  weight_milestone_30: { badgeId: 'weight_milestone_30', category: 'body_goals', displayName: '30 Milestone', description: 'Lost 30 units', icon: '🏆' },
  weight_milestone_40: { badgeId: 'weight_milestone_40', category: 'body_goals', displayName: '40 Milestone', description: 'Lost 40 units', icon: '🚀' },
  weight_milestone_50: { badgeId: 'weight_milestone_50', category: 'body_goals', displayName: '50 Milestone', description: 'Lost 50 units', icon: '👑' },
  goal_weight_reached: { badgeId: 'goal_weight_reached', category: 'body_goals', displayName: 'Goal Achieved', description: 'Reached your goal weight', icon: '🏅' }
};

export function getUnlockedBadges() {
  return storage.get(COLLECTIONS.BADGES);
}

export function isBadgeUnlocked(badgeId) {
  return getUnlockedBadges().some(b => b.badgeId === badgeId);
}

export function unlockBadge(badgeId) {
  if (isBadgeUnlocked(badgeId)) return false;

  const badge = BADGE_DEFINITIONS[badgeId];
  if (!badge) return false;

  const unlocked = getUnlockedBadges();
  unlocked.push({
    ...badge,
    unlockedAt: new Date().toISOString()
  });

  storage.set(COLLECTIONS.BADGES, unlocked);

  // Dispatch event
  window.dispatchEvent(new CustomEvent('badgeUnlocked', { detail: badge }));

  return true;
}

export function checkAndAwardBadges(eventType, eventData = {}) {
  switch (eventType) {
    case 'fast_complete':
      checkFastingMilestoneBadges();
      checkConsistencyBadges();
      break;
    case 'fast_protocol_complete':
      unlockBadge(`protocol_${eventData.protocolId}`);
      checkProgressionBadge();
      break;
    case 'stat_logged':
      checkBodyGoalBadges();
      break;
    case 'meal_logged':
      checkNutritionBadges();
      break;
    case 'meal_consumption_logged':
      checkMealDiversityBadges();
      break;
    case 'workout_logged':
      checkExerciseStreakBadges();
      break;
    case 'maintenance_activated':
      unlockBadge('maintenance_mode');
      break;
  }
}

function checkFastingMilestoneBadges() {
  const fasts = getAllSessions();
  if (fasts.length === 1) unlockBadge('first_fast');
}

function checkConsistencyBadges() {
  const fasts = getAllSessions().sort((a, b) => new Date(b.date) - new Date(a.date));
  if (fasts.length === 0) return;

  let streak = 1;
  let currentDate = new Date(fasts[0].date);

  for (let i = 1; i < fasts.length; i++) {
    const fastDate = new Date(fasts[i].date);
    const dayDiff = Math.floor((currentDate - fastDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
      currentDate = fastDate;
    } else {
      break;
    }
  }

  if (streak >= 7) unlockBadge('streak_7');
  if (streak >= 14) unlockBadge('streak_14');
  if (streak >= 30) unlockBadge('streak_30');
}

function checkProgressionBadge() {
  const requiredProtocols = ['12_12', '10_14', '14_10', '8_16'];
  const allCompleted = requiredProtocols.every(protocolId =>
    isBadgeUnlocked(`protocol_${protocolId}`)
  );

  if (allCompleted) unlockBadge('progression_complete');
}

function checkNutritionBadges() {
  const meals = storage.get(COLLECTIONS.MEALS);
  const count = meals.length;

  if (count >= 5) unlockBadge('meals_5');
  if (count >= 10) unlockBadge('meals_10');
  if (count >= 20) unlockBadge('meals_20');
}

function checkBodyGoalBadges() {
  const stats = storage.get(COLLECTIONS.BODY_STATS);

  if (stats.length === 1) unlockBadge('first_stat');

  if (stats.length >= 2) {
    const sorted = stats.sort((a, b) => new Date(a.date) - new Date(b.date));
    const startWeight = parseFloat(sorted[0].weight);
    const currentWeight = parseFloat(sorted[sorted.length - 1].weight);
    const weightLoss = getWeightLossInUnit(startWeight, currentWeight);

    if (weightLoss >= 5) unlockBadge('weight_milestone_5');
    if (weightLoss >= 10) unlockBadge('weight_milestone_10');
    if (weightLoss >= 20) unlockBadge('weight_milestone_20');
    if (weightLoss >= 30) unlockBadge('weight_milestone_30');
    if (weightLoss >= 40) unlockBadge('weight_milestone_40');
    if (weightLoss >= 50) unlockBadge('weight_milestone_50');

    const goalWeight = storage.getValue(COLLECTIONS.GOAL_WEIGHT);
    if (goalWeight && currentWeight <= parseFloat(goalWeight)) {
      unlockBadge('goal_weight_reached');
    }
  }
}

function getWeightLossInUnit(startWeightLb, currentWeightLb) {
  if (!Number.isFinite(startWeightLb) || !Number.isFinite(currentWeightLb)) return 0;
  const weightLossLb = startWeightLb - currentWeightLb;
  const unit = storage.getValue(COLLECTIONS.WEIGHT_UNIT) || 'lb';
  if (unit === 'kg') {
    return weightLossLb / 2.20462;
  }
  return weightLossLb;
}

/**
 * NEW: Check exercise streak badges
 */
function checkExerciseStreakBadges() {
  const workouts = storage.get(COLLECTIONS.WORKOUTS);

  // First workout badge
  if (workouts.length === 1) {
    unlockBadge('first_workout');
  }

  // Calculate current streak
  if (workouts.length > 0) {
    // Import the streak calculation function dynamically
    import('../exercises/exercises.js').then(module => {
      const { calculateWorkoutStreak } = module;
      const streakData = calculateWorkoutStreak();
      const currentStreak = streakData.currentStreak;

      if (currentStreak >= 3) unlockBadge('workout_streak_3');
      if (currentStreak >= 7) unlockBadge('workout_streak_7');
      if (currentStreak >= 14) unlockBadge('workout_streak_14');
      if (currentStreak >= 30) unlockBadge('workout_streak_30');
    });
  }
}

/**
 * NEW: Check meal diversity badges
 */
function checkMealDiversityBadges() {
  const mealLogs = storage.get(COLLECTIONS.MEAL_LOGS);

  if (mealLogs.length === 0) return;

  // Get unique meal IDs that have been logged
  const uniqueMealIds = new Set(mealLogs.map(log => log.mealId));
  const uniqueCount = uniqueMealIds.size;

  // Unlock diversity badges based on unique meals
  if (uniqueCount >= 5) unlockBadge('diversity_5');
  if (uniqueCount >= 10) unlockBadge('diversity_10');
  if (uniqueCount >= 20) unlockBadge('diversity_20');

  // Check for 7-day variety streak
  import('../meals/meals.js').then(module => {
    const { calculateMealDiversity } = module;
    const diversity = calculateMealDiversity();

    if (diversity.hasVarietyStreak) {
      unlockBadge('variety_streak_7');
    }
  });
}
