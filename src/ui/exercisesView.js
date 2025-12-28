/**
 * Exercises View UI Module
 * RESTORED: Full exercise library and workout logging UI
 */

import {
  getAllExercises,
  addExercise,
  deleteExercise,
  getExercisesByCategory,
  toggleExerciseFavorite,
  getFavoriteExercises,
  logWorkout,
  getAllWorkouts,
  deleteWorkout,
  getWorkoutStats,
  importExercisesFromJSON
} from '../exercises/exercises.js';
import {
  showImportPreview,
  detectDuplicates,
  validateImportData,
  renderExerciseSummary
} from '../utils/importPreview.js';

export function initializeExercisesView() {
  setupWorkoutForm();
  setupExerciseForm();
  setupImportHandlers();
  renderExerciseLibrary();
  renderWorkoutHistory();
  renderWorkoutStats();

  // RESTORED: Listen for exercise and workout updates
  window.addEventListener('exercisesUpdated', () => {
    renderExerciseLibrary();
  });

  window.addEventListener('workoutsUpdated', () => {
    renderWorkoutHistory();
    renderWorkoutStats();
  });
}

/**
 * RESTORED: Setup workout logging form
 */
function setupWorkoutForm() {
  const form = document.getElementById('workoutForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const workoutData = {
      workoutType: document.getElementById('workoutType').value,
      duration: document.getElementById('workoutDuration').value,
      caloriesBurned: document.getElementById('workoutCalories').value,
      notes: document.getElementById('workoutNotes').value,
      date: document.getElementById('workoutDate').value || new Date().toISOString().split('T')[0]
    };

    try {
      logWorkout(workoutData);
      form.reset();
      // Set date to today
      document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
      showNotification('Workout logged successfully!', 'success');
    } catch (error) {
      console.error('Error logging workout:', error);
      showNotification('Error logging workout', 'error');
    }
  });

  // Set default date to today
  const dateInput = document.getElementById('workoutDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

/**
 * RESTORED: Setup custom exercise form
 */
function setupExerciseForm() {
  const form = document.getElementById('exerciseForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const exerciseData = {
      name: document.getElementById('exerciseName').value,
      category: document.getElementById('exerciseCategory').value,
      difficulty: document.getElementById('exerciseDifficulty').value,
      targetReps: document.getElementById('exerciseTargetReps').value,
      progression: document.getElementById('exerciseProgression').value
    };

    try {
      addExercise(exerciseData);
      form.reset();
      showNotification('Exercise added successfully!', 'success');
    } catch (error) {
      console.error('Error adding exercise:', error);
      showNotification('Error adding exercise', 'error');
    }
  });
}

/**
 * UPDATED: Setup import handlers for exercises with preview modal
 */
function setupImportHandlers() {
  const importBtn = document.getElementById('importExercisesBtn');
  const fileInput = document.getElementById('exerciseJsonFileInput');

  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await handleExerciseImportWithPreview(text);
        fileInput.value = '';
      } catch (error) {
        console.error('Error importing JSON:', error);
        showNotification(error.message || 'Error importing exercises from JSON', 'error');
      }
    });
  }
}

/**
 * NEW: Handle exercise import with preview and validation
 */
async function handleExerciseImportWithPreview(content) {
  try {
    // Parse JSON
    const parsedData = JSON.parse(content);
    const parsedExercises = Array.isArray(parsedData) ? parsedData : [parsedData];

    // Validate parsed data
    const { valid, invalid, errors } = validateImportData(parsedExercises, 'name');

    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }

    if (valid.length === 0) {
      throw new Error('No valid exercises found in import file');
    }

    // Detect duplicates
    const existingExercises = getAllExercises();
    const { newItems, duplicates } = detectDuplicates(valid, existingExercises, 'name');

    // Show preview modal
    const result = await showImportPreview({
      title: 'Import Exercises',
      items: newItems,
      duplicates: duplicates,
      itemType: 'exercises',
      renderItemSummary: renderExerciseSummary
    });

    // User confirmed import
    if (result.confirmed) {
      let importedCount = 0;

      // Import new items
      newItems.forEach(exerciseData => {
        addExercise(exerciseData);
        importedCount++;
      });

      // Import duplicates if user opted in
      if (!result.skipDuplicates && duplicates.length > 0) {
        duplicates.forEach(exerciseData => {
          addExercise(exerciseData);
          importedCount++;
        });
      }

      showNotification(
        `Successfully imported ${importedCount} exercises${result.skipDuplicates && duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : ''}`,
        'success'
      );
    }
  } catch (error) {
    // User cancelled or error occurred
    if (error.confirmed === false) {
      showNotification('Import cancelled', 'info');
    } else {
      throw error;
    }
  }
}

/**
 * RESTORED: Render exercise library organized by category with favorites and scrollable windows
 */
function renderExerciseLibrary() {
  const container = document.getElementById('exerciseLibraryContainer');
  if (!container) return;

  const exercises = getAllExercises();

  if (exercises.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 48px 24px; color: #94a3b8;">
        <div style="font-size: 48px; margin-bottom: 16px;">💪</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No exercises in library</div>
        <div style="font-size: 14px;">Default exercises should load automatically</div>
      </div>
    `;
    return;
  }

  // Get favorites
  const favoriteExercises = getFavoriteExercises();
  const regularExercises = exercises.filter(e => !e.favorite);

  let html = '';

  // UPDATED: Favorites section at the top
  if (favoriteExercises.length > 0) {
    html += `
      <div class="favorites-section" style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
          ⭐ Favorites (${favoriteExercises.length})
        </h3>
        <div class="scrollable-exercises-window" style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
          <div class="exercises-grid" style="display: grid; gap: 12px;">
            ${favoriteExercises.map(exercise => renderExerciseCard(exercise)).join('')}
          </div>
        </div>
      </div>
      <hr style="border: none; border-top: 2px solid var(--border-color); margin: 20px 0;">
    `;
  }

  // UPDATED: Regular exercises in scrollable window grouped by category
  const categories = ['Push', 'Pull', 'Core', 'Legs', 'Full Body', 'Other'];

  html += `<div class="scrollable-exercises-window" style="max-height: 600px; overflow-y: auto; padding-right: 8px;">`;

  categories.forEach(category => {
    const categoryExercises = regularExercises.filter(e => e.category === category);
    if (categoryExercises.length === 0) return;

    html += `
      <div class="exercise-category-section" style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">
          ${category} Exercises (${categoryExercises.length})
        </h3>
        <div class="exercises-grid" style="display: grid; gap: 12px;">
          ${categoryExercises.map(exercise => renderExerciseCard(exercise)).join('')}
        </div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;

  // Attach event listeners
  attachExerciseEventListeners();
}

/**
 * RESTORED: Render individual exercise card with favorite toggle
 */
function renderExerciseCard(exercise) {
  const difficultyColor = {
    'Beginner': '#10b981',
    'Intermediate': '#f59e0b',
    'Advanced': '#ef4444'
  }[exercise.difficulty] || '#6366f1';

  const favoriteIcon = exercise.favorite ? '⭐' : '☆';

  return `
    <div class="exercise-card" style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
            ${exercise.name}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background: ${difficultyColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${exercise.difficulty}
            </span>
            <span style="font-size: 13px; color: var(--text-secondary);">
              Target: ${exercise.targetReps} reps
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="favorite-exercise-btn" data-exercise-id="${exercise.id}" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0;" title="Toggle Favorite">
            ${favoriteIcon}
          </button>
          ${exercise.syncStatus === 'local' && exercise.order > 30 ? `
            <button class="delete-exercise-btn" data-exercise-id="${exercise.id}" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #ef4444;" title="Delete">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>

      ${exercise.progression ? `
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color); line-height: 1.4;">
          <strong>Progression:</strong> ${exercise.progression}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Attach event listeners to exercise cards
 */
function attachExerciseEventListeners() {
  // Favorite buttons
  document.querySelectorAll('.favorite-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const exerciseId = e.target.dataset.exerciseId || e.target.parentElement.dataset.exerciseId;
      if (exerciseId) {
        toggleExerciseFavorite(exerciseId);
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const exerciseId = e.target.dataset.exerciseId || e.target.parentElement.dataset.exerciseId;
      if (exerciseId && confirm('Are you sure you want to delete this exercise?')) {
        deleteExercise(exerciseId);
        showNotification('Exercise deleted', 'info');
      }
    });
  });
}

/**
 * RESTORED: Render workout history
 */
function renderWorkoutHistory() {
  const container = document.getElementById('workoutHistoryContainer');
  if (!container) return;

  const workouts = getAllWorkouts();

  if (workouts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 32px; color: #94a3b8;">
        <div style="font-size: 36px; margin-bottom: 12px;">📋</div>
        <div style="font-size: 14px;">No workouts logged yet. Log your first workout above!</div>
      </div>
    `;
    return;
  }

  const html = workouts.map(workout => `
    <div class="workout-card" style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">
            ${workout.workoutType}
          </div>
          <div style="font-size: 13px; color: var(--text-secondary);">
            ${new Date(workout.date).toLocaleDateString()}
          </div>
        </div>
        <button class="delete-workout-btn" data-workout-id="${workout.id}" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #ef4444;" title="Delete">
          🗑️
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">
        <div>
          <span style="color: var(--text-secondary);">Duration:</span>
          <span style="font-weight: 600; color: var(--text-primary);"> ${workout.duration} min</span>
        </div>
        <div>
          <span style="color: var(--text-secondary);">Calories:</span>
          <span style="font-weight: 600; color: var(--text-primary);"> ${workout.caloriesBurned}</span>
        </div>
      </div>

      ${workout.notes ? `
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
          <strong>Notes:</strong> ${workout.notes}
        </div>
      ` : ''}
    </div>
  `).join('');

  container.innerHTML = html;

  // Attach delete listeners
  document.querySelectorAll('.delete-workout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const workoutId = e.target.dataset.workoutId || e.target.parentElement.dataset.workoutId;
      if (workoutId && confirm('Are you sure you want to delete this workout?')) {
        deleteWorkout(workoutId);
        showNotification('Workout deleted', 'info');
      }
    });
  });
}

/**
 * RESTORED: Render workout statistics
 */
function renderWorkoutStats() {
  const stats = getWorkoutStats();

  const totalWorkoutsEl = document.getElementById('totalWorkouts');
  const totalMinutesEl = document.getElementById('totalWorkoutMinutes');
  const thisWeekWorkoutsEl = document.getElementById('thisWeekWorkouts');

  if (totalWorkoutsEl) totalWorkoutsEl.textContent = stats.totalWorkouts;
  if (totalMinutesEl) totalMinutesEl.textContent = stats.totalMinutes;
  if (thisWeekWorkoutsEl) thisWeekWorkoutsEl.textContent = stats.thisWeek;
}

/**
 * Show notification
 */
function showNotification(message, type) {
  console.log(`[${type}] ${message}`);
  if (window.showNotification) {
    window.showNotification(message, type);
  }
}
