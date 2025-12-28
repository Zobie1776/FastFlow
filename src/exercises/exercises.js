/**
 * Exercise Library Management Module
 * RESTORED: Full exercise/workout functionality with defaults and tracking
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { generateUUID, getDeviceId } from '../state/device.js';
import { checkAndAwardBadges } from '../badges/badges.js';

// RESTORED: Default exercises loaded on first run (30 bodyweight exercises)
const DEFAULT_EXERCISES = [
  // Push Exercises
  {name: "Standard Push-up", category: "Push", difficulty: "Beginner", targetReps: 12, progression: "Progress to decline push-ups or diamond push-ups once 20 consecutive reps are achievable with proper form."},
  {name: "Wide-Grip Push-up", category: "Push", difficulty: "Beginner", targetReps: 10, progression: "Emphasizes chest development. Progress to archer push-ups for unilateral strength."},
  {name: "Diamond Push-up", category: "Push", difficulty: "Intermediate", targetReps: 10, progression: "Targets triceps intensely. Progress to one-arm assisted push-ups."},
  {name: "Decline Push-up", category: "Push", difficulty: "Intermediate", targetReps: 12, progression: "Feet elevated on bench or box. Progress to handstand push-up progressions."},
  {name: "Pike Push-up", category: "Push", difficulty: "Intermediate", targetReps: 10, progression: "Develops shoulder strength for handstand push-ups. Progress to wall-assisted handstand push-ups."},
  {name: "Archer Push-up", category: "Push", difficulty: "Advanced", targetReps: 6, progression: "Unilateral strength builder. Progress to one-arm push-ups with reduced assistance."},

  // Pull Exercises
  {name: "Australian Pull-up", category: "Pull", difficulty: "Beginner", targetReps: 12, progression: "Bodyweight row variation. Lower bar height to increase difficulty. Progress to regular pull-ups."},
  {name: "Pull-up (Assisted)", category: "Pull", difficulty: "Beginner", targetReps: 8, progression: "Use resistance band or foot assist. Gradually reduce assistance."},
  {name: "Standard Pull-up", category: "Pull", difficulty: "Intermediate", targetReps: 10, progression: "Progress to wide-grip, weighted pull-ups, or muscle-ups."},
  {name: "Chin-up", category: "Pull", difficulty: "Intermediate", targetReps: 10, progression: "Underhand grip emphasizes biceps. Progress to weighted chin-ups."},
  {name: "Wide-Grip Pull-up", category: "Pull", difficulty: "Advanced", targetReps: 8, progression: "Maximizes lat activation. Progress to one-arm pull-up progressions."},
  {name: "Muscle-up", category: "Pull", difficulty: "Advanced", targetReps: 5, progression: "Advanced explosive pull movement. Progress to ring muscle-ups."},

  // Core Exercises
  {name: "Plank", category: "Core", difficulty: "Beginner", targetReps: "60s", progression: "Hold for longer durations. Progress to weighted planks or single-leg variations."},
  {name: "Bicycle Crunches", category: "Core", difficulty: "Beginner", targetReps: 20, progression: "Controlled movement with full extension. Progress to hanging leg raises."},
  {name: "Mountain Climbers", category: "Core", difficulty: "Intermediate", targetReps: 30, progression: "Increase speed while maintaining form. Progress to explosive cross-body mountain climbers."},
  {name: "Hanging Leg Raise", category: "Core", difficulty: "Intermediate", targetReps: 12, progression: "Keep legs straight. Progress to toes-to-bar."},
  {name: "Dragon Flag", category: "Core", difficulty: "Advanced", targetReps: 8, progression: "Full body lever movement. Progress to one-arm dragon flags."},
  {name: "L-Sit", category: "Core", difficulty: "Advanced", targetReps: "30s", progression: "Hold with straight arms on parallettes or floor. Progress to V-sit."},

  // Lower Body Exercises
  {name: "Bodyweight Squat", category: "Legs", difficulty: "Beginner", targetReps: 20, progression: "Full depth with knees tracking over toes. Progress to pistol squat progressions."},
  {name: "Lunges", category: "Legs", difficulty: "Beginner", targetReps: 12, progression: "Controlled movement with upright torso. Progress to walking lunges or jumping lunges."},
  {name: "Step-ups", category: "Legs", difficulty: "Intermediate", targetReps: 15, progression: "Use elevated platform. Progress to single-leg box jumps."},
  {name: "Bulgarian Split Squat", category: "Legs", difficulty: "Intermediate", targetReps: 12, progression: "Rear foot elevated. Progress to weighted variations."},
  {name: "Pistol Squat", category: "Legs", difficulty: "Advanced", targetReps: 8, progression: "Single-leg squat. Progress to weighted pistol squats."},
  {name: "Jump Squat", category: "Legs", difficulty: "Advanced", targetReps: 15, progression: "Explosive power movement. Progress to box jumps."},

  // Full Body
  {name: "Burpees", category: "Full Body", difficulty: "Intermediate", targetReps: 15, progression: "Full movement with push-up and jump. Progress to muscle-up burpees."},
  {name: "Turkish Get-up (Bodyweight)", category: "Full Body", difficulty: "Intermediate", targetReps: 6, progression: "Complex movement pattern. Progress to weighted Turkish get-ups."},
  {name: "Sprawls", category: "Full Body", difficulty: "Intermediate", targetReps: 20, progression: "Like burpees without the push-up. Progress to burpees with full push-up."},
  {name: "Bear Crawls", category: "Full Body", difficulty: "Beginner", targetReps: "30s", progression: "Crawl forward and backward maintaining low position."},
  {name: "Jumping Jacks", category: "Full Body", difficulty: "Beginner", targetReps: 30, progression: "Classic cardio movement. Progress to burpees."},
  {name: "High Knees", category: "Full Body", difficulty: "Beginner", targetReps: 30, progression: "Running in place with knees to chest. Increase speed."}
];

/**
 * Initialize default exercises on first run
 */
export function initializeDefaultExercises() {
  const exercises = storage.get(COLLECTIONS.EXERCISES);

  if (!exercises || exercises.length === 0) {
    console.log('💪 Initializing default exercises...');

    DEFAULT_EXERCISES.forEach((exerciseData, index) => {
      const exercise = createExerciseObject({
        ...exerciseData,
        id: generateUUID(),
        order: index + 1
      });
      storage.add(COLLECTIONS.EXERCISES, exercise);
    });

    console.log(`✅ ${DEFAULT_EXERCISES.length} default exercises loaded`);
  }
}

/**
 * Create cloud-sync ready exercise object
 */
function createExerciseObject(data) {
  return {
    // Unique identifiers (cloud-sync ready)
    id: data.id || generateUUID(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: data.syncStatus || 'local',
    deviceId: getDeviceId(),

    // Exercise data
    name: data.name,
    category: data.category || 'Other',
    difficulty: data.difficulty || 'Beginner',
    targetReps: data.targetReps || 10,
    progression: data.progression || '',
    description: data.description || '',
    order: data.order || 0,
    favorite: data.favorite || false
  };
}

/**
 * Get all exercises
 */
export function getAllExercises() {
  return storage.get(COLLECTIONS.EXERCISES).sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Add a new exercise
 */
export function addExercise(exerciseData) {
  const exercise = createExerciseObject(exerciseData);

  storage.add(COLLECTIONS.EXERCISES, exercise);

  // RESTORED: Emit event for UI updates
  window.dispatchEvent(new CustomEvent('exercisesUpdated', { detail: { action: 'added', exercise } }));

  return exercise;
}

/**
 * Delete an exercise
 */
export function deleteExercise(id) {
  const result = storage.delete(COLLECTIONS.EXERCISES, id);

  // RESTORED: Emit event for UI updates
  window.dispatchEvent(new CustomEvent('exercisesUpdated', { detail: { action: 'deleted', id } }));

  return result;
}

/**
 * Get exercises by category
 */
export function getExercisesByCategory(category) {
  return getAllExercises().filter(e => e.category === category);
}

/**
 * Get exercises by difficulty
 */
export function getExercisesByDifficulty(difficulty) {
  return getAllExercises().filter(e => e.difficulty === difficulty);
}

/**
 * Toggle favorite status for an exercise
 */
export function toggleExerciseFavorite(id) {
  const exercises = getAllExercises();
  const exercise = exercises.find(e => e.id === id);

  if (exercise) {
    exercise.favorite = !exercise.favorite;
    exercise.updatedAt = new Date().toISOString();
    storage.update(COLLECTIONS.EXERCISES, id, exercise);

    window.dispatchEvent(new CustomEvent('exercisesUpdated', { detail: { action: 'updated', exercise } }));
  }

  return exercise;
}

/**
 * Get favorite exercises
 */
export function getFavoriteExercises() {
  return getAllExercises().filter(e => e.favorite);
}

/**
 * RESTORED: Workout logging functions
 */

/**
 * Create cloud-sync ready workout object
 */
function createWorkoutObject(data) {
  return {
    // Unique identifiers (cloud-sync ready)
    id: data.id || generateUUID(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: data.syncStatus || 'local',
    deviceId: getDeviceId(),

    // Workout data
    date: data.date || new Date().toISOString().split('T')[0],
    workoutType: data.workoutType || 'Calisthenics',
    exercises: data.exercises || [],
    duration: parseInt(data.duration) || 0,
    caloriesBurned: parseInt(data.caloriesBurned) || 0,
    notes: data.notes || '',
    completed: true
  };
}

/**
 * Get all workout logs
 */
export function getAllWorkouts() {
  return storage.get(COLLECTIONS.WORKOUTS).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Log a completed workout
 */
export function logWorkout(workoutData) {
  const workout = createWorkoutObject(workoutData);

  storage.add(COLLECTIONS.WORKOUTS, workout);
  checkAndAwardBadges('workout_logged', workout);

  // RESTORED: Emit event for UI updates
  window.dispatchEvent(new CustomEvent('workoutsUpdated', { detail: { action: 'added', workout } }));

  return workout;
}

/**
 * Delete a workout log
 */
export function deleteWorkout(id) {
  const result = storage.delete(COLLECTIONS.WORKOUTS, id);

  // RESTORED: Emit event for UI updates
  window.dispatchEvent(new CustomEvent('workoutsUpdated', { detail: { action: 'deleted', id } }));

  return result;
}

/**
 * Get workout statistics
 */
export function getWorkoutStats() {
  const workouts = getAllWorkouts();

  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalMinutes: 0,
      totalCalories: 0,
      thisWeek: 0,
      thisMonth: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate streaks
  const streakData = calculateWorkoutStreak();

  return {
    totalWorkouts: workouts.length,
    totalMinutes: workouts.reduce((sum, w) => sum + w.duration, 0),
    totalCalories: workouts.reduce((sum, w) => sum + w.caloriesBurned, 0),
    thisWeek: workouts.filter(w => new Date(w.date) >= weekAgo).length,
    thisMonth: workouts.filter(w => new Date(w.date) >= monthAgo).length,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak
  };
}

/**
 * NEW: Calculate workout streak (consecutive days with at least one workout)
 * Returns { currentStreak, longestStreak }
 */
export function calculateWorkoutStreak() {
  const workouts = getAllWorkouts();

  if (workouts.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique workout dates (local timezone, YYYY-MM-DD format)
  const workoutDates = new Set();
  workouts.forEach(workout => {
    const date = new Date(workout.date);
    const localDateString = date.toISOString().split('T')[0];
    workoutDates.add(localDateString);
  });

  // Convert to sorted array (most recent first)
  const sortedDates = Array.from(workoutDates).sort((a, b) => b.localeCompare(a));

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  // Start from today or yesterday
  let checkDate = workoutDates.has(todayString) ? today : (workoutDates.has(yesterdayString) ? yesterday : null);

  if (checkDate) {
    while (true) {
      const checkDateString = checkDate.toISOString().split('T')[0];
      if (workoutDates.has(checkDateString)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);

    // Calculate day difference
    const diffTime = current - next;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak)
  };
}

/**
 * NEW: Get workout streak data (for badge checking)
 */
export function getWorkoutStreakData() {
  return calculateWorkoutStreak();
}

/**
 * RESTORED: Import exercises from JSON
 */
export function importExercisesFromJSON(jsonData) {
  try {
    const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const exercisesArray = Array.isArray(parsedData) ? parsedData : [parsedData];

    const imported = [];
    const existing = getAllExercises();

    exercisesArray.forEach(exerciseData => {
      // Basic duplicate detection (by name)
      const isDuplicate = existing.some(e => e.name.toLowerCase() === exerciseData.name.toLowerCase());

      if (!isDuplicate) {
        const exercise = addExercise(exerciseData);
        imported.push(exercise);
      }
    });

    console.log(`✅ Imported ${imported.length} exercises (${exercisesArray.length - imported.length} duplicates skipped)`);
    return { imported: imported.length, skipped: exercisesArray.length - imported.length };
  } catch (error) {
    console.error('Error importing exercises from JSON:', error);
    throw error;
  }
}
