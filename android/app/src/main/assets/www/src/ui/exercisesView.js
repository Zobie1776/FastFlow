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
  importExercisesFromJSON,
  getAllWorkoutPlans,
  getWorkoutPlansByFilter,
  logWorkoutFromPlan,
  logWorkoutFromExercise
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
  setupWorkoutPlansUI();
  setupQuickLogDropdown();
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
    // Update file input to accept text and PDF files
    fileInput.setAttribute('accept', '.txt,.md,.pdf,text/plain,text/markdown,application/pdf');

    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        let text = '';

        // Handle different file types
        if (file.type === 'application/pdf') {
          showNotification('PDF import coming soon - please export as text for now', 'info');
          fileInput.value = '';
          return;
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          text = await file.text();
        } else {
          // Try to parse as JSON for backward compatibility
          text = await file.text();
        }

        await handleExerciseImportWithPreview(text, file.name);
        fileInput.value = '';
      } catch (error) {
        console.error('Error importing file:', error);
        showNotification(error.message || 'Error importing exercises', 'error');
      }
    });
  }
}

/**
 * NEW: Handle exercise import with smart parsing and preview
 */
async function handleExerciseImportWithPreview(content, filename = '') {
  try {
    let parsedExercises = [];

    // Try JSON parsing first
    try {
      const parsedData = JSON.parse(content);
      parsedExercises = Array.isArray(parsedData) ? parsedData : [parsedData];
    } catch (jsonError) {
      // If JSON parsing fails, try smart text parsing
      parsedExercises = parseExercisesFromText(content);

      if (parsedExercises.length === 0) {
        showTextImportPreview(content, filename);
        return;
      }
    }

    // Validate parsed data
    const { valid, invalid, errors } = validateImportData(parsedExercises, 'name');

    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }

    if (valid.length === 0) {
      showTextImportPreview(content, filename);
      return;
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
 * Parse exercises from plain text
 */
function parseExercisesFromText(text) {
  const exercises = [];
  const lines = text.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and obvious headers
    if (!trimmed || trimmed.length < 3) continue;
    if (trimmed.match(/^(exercise|workout|name|description)/i)) continue;

    // Try to extract exercise name and details
    // Format: "Exercise Name - details" or "Exercise Name (details)" or just "Exercise Name"
    const match = trimmed.match(/^([^-(:]+)(?:[-(:]\s*(.+))?$/);

    if (match) {
      const name = match[1].trim();
      const details = match[2]?.trim() || '';

      // Try to extract reps/sets
      const repsMatch = details.match(/(\d+)\s*(reps?|x|times?)/i);
      const setsMatch = details.match(/(\d+)\s*sets?/i);

      exercises.push({
        name: name,
        category: 'Other',
        difficulty: 'Beginner',
        targetReps: repsMatch ? parseInt(repsMatch[1]) : 10,
        description: details,
        progression: ''
      });
    }
  }

  return exercises;
}

/**
 * Show text import preview for manual editing
 */
function showTextImportPreview(content, filename) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-modal-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div class="modal-content" style="background: var(--modal-bg); border-radius: 12px; padding: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; color: var(--modal-text-primary);">
      <h3 style="margin: 0 0 16px 0; font-size: 20px; color: var(--modal-text-primary);">Import Text: ${filename}</h3>

      <div class="example-box" style="background: var(--bg-secondary); border-left: 4px solid var(--warning-color); padding: 12px; margin-bottom: 16px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: var(--modal-text-primary);">
          <strong>Note:</strong> We couldn't automatically format this file. You can edit the text below and we'll try to extract exercises.
        </p>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--modal-text-primary);">
          Paste or edit exercise list (one per line):
        </label>
        <textarea id="importTextContent" style="width: 100%; min-height: 200px; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-family: monospace; font-size: 13px; color: var(--modal-text-primary); background: var(--bg-secondary);" placeholder="Exercise Name - details\nAnother Exercise - 10 reps">${content}</textarea>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="cancelTextImport" class="btn btn-outline" style="flex: 1;">Cancel</button>
        <button id="parseTextImport" class="btn btn-primary" style="flex: 2;">Parse & Preview</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('cancelTextImport').addEventListener('click', () => {
    modal.remove();
  });

  document.getElementById('parseTextImport').addEventListener('click', () => {
    const text = document.getElementById('importTextContent').value;
    modal.remove();
    handleExerciseImportWithPreview(text, filename);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
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
    <div class="exercise-card" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
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

      <button class="log-exercise-btn btn btn-outline btn-block" data-exercise-name="${exercise.name}" style="margin-top: 12px; font-size: 13px; padding: 8px;">
        Log Workout
      </button>
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

  // Log workout buttons
  document.querySelectorAll('.log-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const exerciseName = e.target.dataset.exerciseName;
      if (exerciseName) {
        showExerciseLogModal(exerciseName);
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
    <div class="workout-card" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
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

/**
 * Setup workout plans UI with filters
 */
function setupWorkoutPlansUI() {
  const container = document.getElementById('workoutPlansContainer');
  if (!container) {
    // Create container after workout form if it doesn't exist
    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm && workoutForm.parentElement) {
      const plansCard = document.createElement('div');
      plansCard.className = 'card';
      plansCard.innerHTML = `
        <h2>Workout Plans</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <select id="planCategoryFilter" class="form-select" style="flex: 1; min-width: 140px;">
            <option value="">All Categories</option>
            <option value="HIIT">HIIT</option>
            <option value="Calisthenics">Calisthenics</option>
            <option value="Gym">Gym</option>
          </select>
          <select id="planDifficultyFilter" class="form-select" style="flex: 1; min-width: 140px;">
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select id="planTimeFilter" class="form-select" style="flex: 1; min-width: 140px;">
            <option value="">Any Duration</option>
            <option value="10">≤ 10 min</option>
            <option value="20">≤ 20 min</option>
            <option value="30">≤ 30 min</option>
            <option value="60">≤ 60 min</option>
          </select>
        </div>
        <div id="workoutPlansContainer" style="display: grid; gap: 12px; max-height: 600px; overflow-y: auto; padding-right: 4px;"></div>
      `;
      workoutForm.parentElement.insertAdjacentElement('afterend', plansCard);
    }
  }

  renderWorkoutPlans();

  // Setup filter listeners
  ['planCategoryFilter', 'planDifficultyFilter', 'planTimeFilter'].forEach(id => {
    const filter = document.getElementById(id);
    if (filter) {
      filter.addEventListener('change', renderWorkoutPlans);
    }
  });
}

/**
 * Render workout plans based on filters
 */
function renderWorkoutPlans() {
  const container = document.getElementById('workoutPlansContainer');
  if (!container) return;

  const categoryFilter = document.getElementById('planCategoryFilter')?.value || '';
  const difficultyFilter = document.getElementById('planDifficultyFilter')?.value || '';
  const timeFilter = document.getElementById('planTimeFilter')?.value || '';

  const filters = {
    category: categoryFilter,
    difficultyLevel: difficultyFilter,
    maxDuration: timeFilter ? parseInt(timeFilter) : null
  };

  const plans = getWorkoutPlansByFilter(filters);

  if (plans.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-secondary);">No plans match the selected filters</div>';
    return;
  }

  container.innerHTML = plans.map(plan => `
    <div class="workout-plan-card" style="background: var(--bg-primary, white); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
            ${plan.planName}
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${plan.category}
            </span>
            <span style="background: ${getDifficultyColor(plan.difficultyLevel)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${plan.difficultyLevel}
            </span>
            <span style="font-size: 13px; color: var(--text-secondary);">
              ~${plan.estimatedDurationMinutes} min
            </span>
          </div>
        </div>
      </div>

      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
        <strong>Exercises:</strong> ${plan.exercises.join(', ')}
      </div>

      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
        <strong>Structure:</strong> ${plan.metadata.sets ? `${plan.metadata.sets} sets, ${plan.metadata.reps} reps, ${plan.metadata.rest} rest` : `${plan.metadata.rounds} rounds, ${plan.metadata.workTime} work, ${plan.metadata.restTime} rest`}
      </div>

      <button class="open-plan-btn btn btn-primary btn-block" data-plan-id="${plan.planId}" style="margin-top: 12px; font-size: 13px;">
        Open Workout
      </button>
    </div>
  `).join('');

  // Attach event listeners
  document.querySelectorAll('.open-plan-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const planId = e.target.dataset.planId;
      if (planId) {
        openWorkoutPlanModal(planId);
      }
    });
  });
}

/**
 * Open workout plan modal with timer and structured interface
 */
function openWorkoutPlanModal(planId) {
  const plan = getWorkoutPlanById(planId);
  if (!plan) return;

  let timerStartTime = null;
  let timerInterval = null;
  let elapsedSeconds = 0;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-modal-overlay);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 16px 16px 0 0; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);">
      <!-- Header -->
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <h2 style="margin: 0 0 8px 0; font-size: 22px; color: var(--modal-text-primary);">
              ${plan.planName}
            </h2>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <span style="background: var(--primary-color); color: white; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                ${plan.category}
              </span>
              <span style="background: ${getDifficultyColor(plan.difficultyLevel)}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                ${plan.difficultyLevel}
              </span>
              <span style="font-size: 13px; color: var(--modal-text-secondary);">
                ~${plan.estimatedDurationMinutes} min
              </span>
            </div>
          </div>
          <button id="closeWorkoutModal" style="background: none; border: none; font-size: 24px; color: var(--modal-text-secondary); cursor: pointer; padding: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">×</button>
        </div>

        <!-- Timer Section -->
        <div style="margin-top: 16px; padding: 16px; background: var(--bg-secondary); border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; color: var(--modal-text-secondary); margin-bottom: 4px;">Elapsed Time</div>
            <div id="workoutTimer" style="font-size: 28px; font-weight: 700; color: var(--primary-color); font-variant-numeric: tabular-nums;">00:00:00</div>
          </div>
          <button id="toggleTimer" class="btn btn-primary" style="padding: 10px 20px;">
            Start Workout
          </button>
        </div>
      </div>

      <!-- Exercise List (Scrollable) -->
      <div style="flex: 1; overflow-y: auto; padding: 16px 24px;">
        <div style="margin-bottom: 12px;">
          <strong style="color: var(--modal-text-primary); font-size: 15px;">Exercises:</strong>
        </div>
        <div style="display: grid; gap: 12px;">
          ${plan.exercises.map((exerciseName, idx) => `
            <div class="exercise-item" style="background: var(--bg-secondary); border: 2px solid var(--border-color); border-radius: 8px; padding: 14px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <input type="checkbox" id="exercise_${idx}" style="width: 20px; height: 20px; margin-top: 2px; cursor: pointer;">
                <div style="flex: 1;">
                  <label for="exercise_${idx}" style="font-weight: 600; color: var(--modal-text-primary); font-size: 15px; cursor: pointer; display: block; margin-bottom: 4px;">
                    ${exerciseName}
                  </label>
                  <div style="font-size: 13px; color: var(--modal-text-secondary);">
                    ${plan.metadata.sets ? `${plan.metadata.sets} sets × ${plan.metadata.reps} reps` : `${plan.metadata.rounds} rounds × ${plan.metadata.workTime}`}
                    ${plan.metadata.rest ? ` • ${plan.metadata.rest} rest` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Bottom Action Bar -->
      <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); flex-shrink: 0; background: var(--modal-bg);">
        <div style="display: flex; gap: 12px;">
          <button id="cancelWorkout" class="btn btn-outline" style="flex: 1;">
            Cancel
          </button>
          <button id="logWorkout" class="btn btn-primary" style="flex: 2;">
            Log This Workout
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Timer functions
  function updateTimerDisplay() {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    const timerEl = document.getElementById('workoutTimer');
    if (timerEl) {
      timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  function startTimer() {
    if (timerInterval) return;

    timerStartTime = Date.now() - (elapsedSeconds * 1000);
    timerInterval = setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
      updateTimerDisplay();
    }, 1000);

    const toggleBtn = document.getElementById('toggleTimer');
    if (toggleBtn) {
      toggleBtn.textContent = 'Pause';
      toggleBtn.classList.remove('btn-primary');
      toggleBtn.classList.add('btn-outline');
    }
  }

  function pauseTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const toggleBtn = document.getElementById('toggleTimer');
    if (toggleBtn) {
      toggleBtn.textContent = 'Resume';
      toggleBtn.classList.remove('btn-outline');
      toggleBtn.classList.add('btn-primary');
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Event listeners
  document.getElementById('toggleTimer').addEventListener('click', () => {
    if (timerInterval) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  document.getElementById('closeWorkoutModal').addEventListener('click', () => {
    if (timerInterval && elapsedSeconds > 0) {
      if (confirm('Exit workout without saving?')) {
        stopTimer();
        modal.remove();
      }
    } else {
      modal.remove();
    }
  });

  document.getElementById('cancelWorkout').addEventListener('click', () => {
    if (timerInterval && elapsedSeconds > 0) {
      if (confirm('Exit workout without saving?')) {
        stopTimer();
        modal.remove();
      }
    } else {
      modal.remove();
    }
  });

  document.getElementById('logWorkout').addEventListener('click', () => {
    stopTimer();

    const workoutData = {
      planId: plan.planId,
      planName: plan.planName,
      duration: Math.floor(elapsedSeconds / 60) || plan.estimatedDurationMinutes,
      caloriesBurned: estimateCaloriesForPlan(plan),
      notes: `${plan.planName} - ${plan.metadata.sets || plan.metadata.rounds} ${plan.metadata.sets ? 'sets' : 'rounds'}`
    };

    try {
      logWorkoutFromPlan(planId, workoutData);
      modal.remove();
      showNotification('Workout logged successfully!', 'success');
    } catch (error) {
      console.error('Error logging workout:', error);
      showNotification('Error logging workout', 'error');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (timerInterval && elapsedSeconds > 0) {
        if (confirm('Exit workout without saving?')) {
          stopTimer();
          modal.remove();
        }
      } else {
        modal.remove();
      }
    }
  });
}

/**
 * Log workout from plan
 */
function logPlanWorkout(planId) {
  try {
    logWorkoutFromPlan(planId);
    showNotification('Workout logged successfully!', 'success');
  } catch (error) {
    console.error('Error logging plan workout:', error);
    showNotification('Error logging workout', 'error');
  }
}

/**
 * Get difficulty color
 */
function getDifficultyColor(difficulty) {
  return {
    'Beginner': '#10b981',
    'Intermediate': '#f59e0b',
    'Advanced': '#ef4444'
  }[difficulty] || '#6366f1';
}

/**
 * Setup quick log dropdown
 */
function setupQuickLogDropdown() {
  const workoutTypeSelect = document.getElementById('workoutType');
  if (!workoutTypeSelect) return;

  // Add quick log option to the select
  const quickLogOption = document.createElement('optgroup');
  quickLogOption.label = 'Quick Log Templates';

  const plans = getAllWorkoutPlans();
  plans.slice(0, 6).forEach(plan => {
    const option = document.createElement('option');
    option.value = `plan:${plan.planId}`;
    option.textContent = `${plan.planName} (${plan.estimatedDurationMinutes}min)`;
    quickLogOption.appendChild(option);
  });

  workoutTypeSelect.insertBefore(quickLogOption, workoutTypeSelect.firstChild);

  // Handle quick log selection
  workoutTypeSelect.addEventListener('change', (e) => {
    if (e.target.value.startsWith('plan:')) {
      const planId = e.target.value.replace('plan:', '');
      const plan = getAllWorkoutPlans().find(p => p.planId === planId);
      if (plan) {
        // Pre-fill form
        document.getElementById('workoutDuration').value = plan.estimatedDurationMinutes;
        document.getElementById('workoutCalories').value = Math.round(plan.estimatedDurationMinutes * 7);
        document.getElementById('workoutNotes').value = `${plan.planName} - ${plan.metadata.sets || plan.metadata.rounds} ${plan.metadata.sets ? 'sets' : 'rounds'}`;
      }
    }
  });
}

/**
 * Show exercise log modal
 */
function showExerciseLogModal(exerciseName) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-modal-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 12px; padding: 24px; max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; color: var(--modal-text-primary);">Log ${exerciseName}</h3>

      <form id="quickExerciseLogForm">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" id="quickLogDate" class="form-input" required>
        </div>

        <div class="form-group">
          <label class="form-label">Duration (minutes)</label>
          <input type="number" id="quickLogDuration" class="form-input" value="15" required>
        </div>

        <div class="form-group">
          <label class="form-label">Calories Burned</label>
          <input type="number" id="quickLogCalories" class="form-input" value="100" required>
        </div>

        <div class="form-group">
          <label class="form-label">Sets</label>
          <input type="number" id="quickLogSets" class="form-input" value="3">
        </div>

        <div class="form-group">
          <label class="form-label">Reps</label>
          <input type="text" id="quickLogReps" class="form-input" value="10">
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea id="quickLogNotes" class="form-textarea" rows="2"></textarea>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Log Workout</button>
          <button type="button" class="btn btn-outline" id="cancelQuickLog">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Set default date
  document.getElementById('quickLogDate').value = new Date().toISOString().split('T')[0];

  // Handle submit
  document.getElementById('quickExerciseLogForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const sets = document.getElementById('quickLogSets').value;
    const reps = document.getElementById('quickLogReps').value;
    const notes = document.getElementById('quickLogNotes').value;

    const workoutData = {
      date: document.getElementById('quickLogDate').value,
      duration: parseInt(document.getElementById('quickLogDuration').value),
      caloriesBurned: parseInt(document.getElementById('quickLogCalories').value),
      sets: sets ? parseInt(sets) : null,
      reps: reps || null,
      notes: notes
    };

    try {
      logWorkoutFromExercise(exerciseName, workoutData);
      showNotification('Workout logged successfully!', 'success');
      modal.remove();
    } catch (error) {
      console.error('Error logging exercise workout:', error);
      showNotification('Error logging workout', 'error');
    }
  });

  // Handle cancel
  document.getElementById('cancelQuickLog').addEventListener('click', () => {
    modal.remove();
  });

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
