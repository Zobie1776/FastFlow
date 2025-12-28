/**
 * Meals View UI Module
 * RESTORED: Full meal library UI with add, import, and favorite features
 */

import {
  getAllMeals,
  addMeal,
  updateMeal,
  deleteMeal,
  toggleFavorite,
  importMealsFromJSON,
  importMealsFromText,
  logMealConsumption,
  getAllMealLogs,
  deleteMealLog,
  calculateMealDiversity
} from '../meals/meals.js';
import {
  showImportPreview,
  detectDuplicates,
  validateImportData,
  renderMealSummary
} from '../utils/importPreview.js';
import {
  getPreferredWaterUnit,
  setPreferredWaterUnit,
  getDailyWaterGoalMl,
  setDailyWaterGoalMl,
  getTodayWaterLog,
  addWaterEntry
} from '../meals/water.js';

// State management for category filter
let currentCategoryFilter = 'all';
let currentDietaryFilter = 'all';
let currentSearchQuery = '';

const DIETARY_TAG_LABELS = {
  'high-protein': 'High Protein',
  keto: 'Keto / Low Carb',
  mixed: 'Mixed / Balanced'
};

function normalizeDietaryTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return ['high-protein'];
  }
  return tags;
}

function getSelectedDietaryTags(container) {
  const inputs = container.querySelectorAll('input[name="mealDietaryTags"]:checked');
  const values = Array.from(inputs).map(input => input.value);
  return values.length > 0 ? values : ['high-protein'];
}

function renderDietaryTags(meal) {
  const tags = normalizeDietaryTags(meal.dietaryTags);
  return tags
    .map(tag => DIETARY_TAG_LABELS[tag] || tag)
    .map(label => `<span style="font-size: 11px; font-weight: 600; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 999px;">${label}</span>`)
    .join('');
}

export function initializeMealsView() {
  setupMealForm();
  setupImportHandlers();
  setupCategoryFilter();
  setupDietaryFilter();
  setupMealSearch();
  setupWaterTracker();
  renderMealsLibrary();
  renderMealDiversityScore();
  renderWaterTracker();

  // RESTORED: Listen for meal updates
  window.addEventListener('mealsUpdated', () => {
    renderMealsLibrary();
  });

  // NEW: Listen for meal log updates
  window.addEventListener('mealLogsUpdated', () => {
    renderMealDiversityScore();
  });
}

/**
 * UPDATED: Setup meal creation form with category support
 */
function setupMealForm() {
  const form = document.getElementById('mealForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const mealData = {
      name: document.getElementById('mealName').value,
      type: document.getElementById('mealType').value,
      category: document.getElementById('mealCategory')?.value || document.getElementById('mealType').value,
      protein: document.getElementById('mealProtein').value,
      calories: document.getElementById('mealCalories').value,
      carbs: document.getElementById('mealCarbs').value,
      fats: document.getElementById('mealFats').value,
      ingredients: document.getElementById('mealIngredients').value,
      dietaryTags: getSelectedDietaryTags(form)
    };

    try {
      addMeal(mealData);
      form.reset();
      showNotification('Meal added successfully!', 'success');
    } catch (error) {
      console.error('Error adding meal:', error);
      showNotification('Error adding meal', 'error');
    }
  });
}

/**
 * NEW: Setup category filter dropdown
 */
function setupCategoryFilter() {
  const filterSelect = document.getElementById('mealCategoryFilter');
  if (!filterSelect) return;

  // Set initial value
  filterSelect.value = currentCategoryFilter;

  // Listen for changes
  filterSelect.addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    renderMealsLibrary();
  });
}

/**
 * NEW: Setup dietary tag filter buttons
 */
function setupDietaryFilter() {
  const filterContainer = document.getElementById('mealDietaryFilters');
  if (!filterContainer) return;

  filterContainer.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-dietary-filter]');
    if (!button) return;
    currentDietaryFilter = button.dataset.dietaryFilter;

    filterContainer.querySelectorAll('button[data-dietary-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dietaryFilter === currentDietaryFilter);
    });

    renderMealsLibrary();
  });

  const defaultButton = filterContainer.querySelector('button[data-dietary-filter="all"]');
  if (defaultButton) {
    defaultButton.classList.add('active');
  }
}

/**
 * NEW: Setup meal search input
 */
function setupMealSearch() {
  const searchInput = document.getElementById('mealSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    renderMealsLibrary();
  });
}

/**
 * UPDATED: Setup import handlers with preview modal (JSON, txt, md)
 */
function setupImportHandlers() {
  const importJsonBtn = document.getElementById('importMealsJsonBtn');
  const importTextBtn = document.getElementById('importMealsTextBtn');
  const jsonFileInput = document.getElementById('mealJsonFileInput');
  const textFileInput = document.getElementById('mealTextFileInput');

  if (importJsonBtn && jsonFileInput) {
    importJsonBtn.addEventListener('click', () => {
      jsonFileInput.click();
    });

    jsonFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await handleMealImportWithPreview(text, 'json');
        jsonFileInput.value = '';
      } catch (error) {
        console.error('Error importing JSON:', error);
        showNotification(error.message || 'Error importing meals from JSON', 'error');
      }
    });
  }

  if (importTextBtn && textFileInput) {
    importTextBtn.addEventListener('click', () => {
      textFileInput.click();
    });

    textFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await handleMealImportWithPreview(text, 'text');
        textFileInput.value = '';
      } catch (error) {
        console.error('Error importing text:', error);
        showNotification(error.message || 'Error importing meals from text file', 'error');
      }
    });
  }
}

function setupWaterTracker() {
  const unitInputs = document.querySelectorAll('input[name="waterUnit"]');
  const quickAddContainer = document.getElementById('waterQuickAddButtons');
  const customAmountInput = document.getElementById('waterCustomAmount');
  const addCustomBtn = document.getElementById('waterAddCustomBtn');
  const goalInput = document.getElementById('waterDailyGoalInput');

  if (unitInputs.length) {
    unitInputs.forEach(input => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        setPreferredWaterUnit(input.value);
        renderWaterTracker();
      });
    });
  }

  if (quickAddContainer) {
    quickAddContainer.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-water-amount]');
      if (!button) return;
      const amountMl = parseInt(button.dataset.waterAmount, 10);
      if (!Number.isFinite(amountMl) || amountMl <= 0) return;
      addWaterEntry(amountMl);
      renderWaterTracker();
    });
  }

  if (addCustomBtn && customAmountInput) {
    addCustomBtn.addEventListener('click', () => {
      const amount = parseFloat(customAmountInput.value);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const unit = getPreferredWaterUnit();
      const amountMl = unit === 'oz' ? convertOzToMl(amount) : Math.round(amount);
      addWaterEntry(amountMl);
      customAmountInput.value = '';
      renderWaterTracker();
    });
  }

  if (goalInput) {
    goalInput.addEventListener('change', () => {
      const value = parseFloat(goalInput.value);
      if (!Number.isFinite(value) || value <= 0) return;
      const unit = getPreferredWaterUnit();
      const goalMl = unit === 'oz' ? convertOzToMl(value) : Math.round(value);
      setDailyWaterGoalMl(goalMl);
      renderWaterTracker();
    });
  }
}

function renderWaterTracker() {
  const unit = getPreferredWaterUnit();
  const log = getTodayWaterLog();
  const goalMl = getDailyWaterGoalMl();

  const totalDisplay = formatAmount(log.totalMl, unit);
  const goalDisplay = formatAmount(goalMl, unit);
  const percent = goalMl > 0 ? Math.min(100, Math.round((log.totalMl / goalMl) * 100)) : 0;
  const isComplete = log.totalMl >= goalMl;

  const progressBar = document.getElementById('waterProgressBar');
  const progressText = document.getElementById('waterProgressText');
  const goalInput = document.getElementById('waterDailyGoalInput');
  const goalUnitLabel = document.getElementById('waterGoalUnitLabel');
  const quickAddContainer = document.getElementById('waterQuickAddButtons');
  const entriesList = document.getElementById('waterEntriesList');

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.style.background = isComplete ? 'var(--success-color)' : 'var(--primary-color)';
  }

  if (progressText) {
    progressText.textContent = `${totalDisplay} ${unit} / ${goalDisplay} ${unit} today`;
  }

  const unitInputs = document.querySelectorAll('input[name="waterUnit"]');
  if (unitInputs.length) {
    unitInputs.forEach(input => {
      input.checked = input.value === unit;
    });
  }

  if (goalInput) {
    goalInput.value = goalDisplay;
  }

  if (goalUnitLabel) {
    goalUnitLabel.textContent = unit;
  }

  if (quickAddContainer) {
    quickAddContainer.innerHTML = getQuickAddOptions(unit)
      .map(option => `
        <button type="button" class="btn btn-outline" data-water-amount="${option.amountMl}">
          +${option.display}
        </button>
      `).join('');
  }

  if (entriesList) {
    if (!log.entries.length) {
      entriesList.textContent = 'No water logged yet today.';
    } else {
      const entries = [...log.entries].reverse().slice(0, 6);
      entriesList.innerHTML = entries.map(entry => {
        const amount = formatAmount(entry.amountMl, unit);
        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<div>${time} • ${amount} ${unit}</div>`;
      }).join('');
    }
  }
}

function getQuickAddOptions(unit) {
  if (unit === 'oz') {
    const options = [8, 12, 16];
    return options.map(amount => ({
      display: `${amount} oz`,
      amountMl: convertOzToMl(amount)
    }));
  }

  const options = [250, 500, 750];
  return options.map(amount => ({
    display: `${amount} ml`,
    amountMl: amount
  }));
}

function convertOzToMl(ounces) {
  return Math.round(ounces * 29.5735);
}

function formatAmount(amountMl, unit) {
  if (unit === 'oz') {
    return Math.round(amountMl / 29.5735);
  }
  return Math.round(amountMl);
}

/**
 * NEW: Handle meal import with preview and validation
 */
async function handleMealImportWithPreview(content, format) {
  try {
    // Parse based on format
    let parsedMeals;
    if (format === 'json') {
      const parsedData = JSON.parse(content);
      parsedMeals = Array.isArray(parsedData) ? parsedData : [parsedData];
    } else if (format === 'text') {
      // Parse text format
      parsedMeals = parseTextMeals(content);
    } else {
      throw new Error('Unsupported format');
    }

    // Validate parsed data
    const { valid, invalid, errors } = validateImportData(parsedMeals, 'name');

    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }

    if (valid.length === 0) {
      throw new Error('No valid meals found in import file');
    }

    // Detect duplicates
    const existingMeals = getAllMeals();
    const { newItems, duplicates } = detectDuplicates(valid, existingMeals, 'name');

    // Show preview modal
    const result = await showImportPreview({
      title: 'Import Meals',
      items: newItems,
      duplicates: duplicates,
      itemType: 'meals',
      renderItemSummary: renderMealSummary
    });

    // User confirmed import
    if (result.confirmed) {
      let importedCount = 0;

      // Import new items
      newItems.forEach(mealData => {
        addMeal(mealData);
        importedCount++;
      });

      // Import duplicates if user opted in
      if (!result.skipDuplicates && duplicates.length > 0) {
        duplicates.forEach(mealData => {
          addMeal(mealData);
          importedCount++;
        });
      }

      showNotification(
        `Successfully imported ${importedCount} meals${result.skipDuplicates && duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : ''}`,
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
 * NEW: Parse text/markdown format meals
 */
function parseTextMeals(textContent) {
  const meals = [];
  const mealBlocks = textContent.split(/\n\s*\n/).filter(block => block.trim());

  mealBlocks.forEach(block => {
    const meal = {};
    const lines = block.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^MEAL:\s*/i)) {
        meal.name = trimmed.replace(/^MEAL:\s*/i, '').trim();
      } else if (trimmed.match(/^Type:\s*/i)) {
        meal.type = trimmed.replace(/^Type:\s*/i, '').trim();
      } else if (trimmed.match(/^Protein:\s*/i)) {
        meal.protein = parseFloat(trimmed.replace(/^Protein:\s*/i, '').replace(/[^\d.]/g, ''));
      } else if (trimmed.match(/^Calories:\s*/i)) {
        meal.calories = parseFloat(trimmed.replace(/^Calories:\s*/i, '').replace(/[^\d.]/g, ''));
      } else if (trimmed.match(/^Carbs:\s*/i)) {
        meal.carbs = parseFloat(trimmed.replace(/^Carbs:\s*/i, '').replace(/[^\d.]/g, ''));
      } else if (trimmed.match(/^Fats:\s*/i)) {
        meal.fats = parseFloat(trimmed.replace(/^Fats:\s*/i, '').replace(/[^\d.]/g, ''));
      } else if (trimmed.match(/^Ingredients:\s*/i)) {
        meal.ingredients = trimmed.replace(/^Ingredients:\s*/i, '').trim();
      } else if (trimmed.match(/^Tags:\s*/i)) {
        meal.dietaryTags = trimmed
          .replace(/^Tags:\s*/i, '')
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
      }
    });

    if (meal.name) {
      meals.push(meal);
    }
  });

  return meals;
}

/**
 * NEW: Render meal diversity score widget
 */
function renderMealDiversityScore() {
  const container = document.getElementById('mealDiversityScore');
  if (!container) return;

  const diversity = calculateMealDiversity();

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; color: white; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Meal Diversity Score</h3>
        <span style="cursor: help;" title="Score based on unique meals logged in the last 7 days. Each unique meal = +1 point (max 3/day). Weekly max = 21 points.">
          ℹ️
        </span>
      </div>

      <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;">
        <div style="font-size: 48px; font-weight: 700;">${diversity.weeklyScore}</div>
        <div style="font-size: 20px; opacity: 0.9;">/ ${diversity.maxScore}</div>
      </div>

      <!-- Progress Bar -->
      <div style="background: rgba(255,255,255,0.2); border-radius: 8px; height: 12px; overflow: hidden; margin-bottom: 12px;">
        <div style="background: white; height: 100%; width: ${diversity.percentage}%; transition: width 0.3s ease;"></div>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
        <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px;">
          <div style="opacity: 0.9; margin-bottom: 4px;">Unique Meals</div>
          <div style="font-size: 20px; font-weight: 600;">${diversity.uniqueMealsThisWeek}</div>
        </div>
        <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px;">
          <div style="opacity: 0.9; margin-bottom: 4px;">Variety Days</div>
          <div style="font-size: 20px; font-weight: 600;">${diversity.daysWithVariety} / 7</div>
        </div>
      </div>

      <div style="font-size: 12px; opacity: 0.8; margin-top: 12px; line-height: 1.4;">
        💡 Tip: Log different meals each day to increase your diversity score and unlock badges!
      </div>
    </div>
  `;
}

function applyMealFilters(meals) {
  let filtered = meals;

  if (currentCategoryFilter !== 'all') {
    filtered = filtered.filter(meal => meal.category === currentCategoryFilter);
  }

  if (currentDietaryFilter !== 'all') {
    filtered = filtered.filter(meal => normalizeDietaryTags(meal.dietaryTags).includes(currentDietaryFilter));
  }

  if (currentSearchQuery) {
    filtered = filtered.filter(meal => {
      const name = meal.name ? meal.name.toLowerCase() : '';
      const ingredients = meal.ingredients ? meal.ingredients.toLowerCase() : '';
      return name.includes(currentSearchQuery) || ingredients.includes(currentSearchQuery);
    });
  }

  return filtered;
}

/**
 * UPDATED: Render meals library with favorites section, scrollable window, and category filter
 */
function renderMealsLibrary() {
  const container = document.getElementById('mealsLibraryContainer');
  if (!container) return;

  // Apply combined filters: category, dietary tag, search
  const meals = applyMealFilters(getAllMeals());

  if (meals.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 48px 24px; color: #94a3b8;">
        <div style="font-size: 48px; margin-bottom: 16px;">🍽️</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No meals in library</div>
        <div style="font-size: 14px;">Add your first meal using the form above or import from a file</div>
      </div>
    `;
    return;
  }

  // Get favorites
  const favoriteMeals = meals.filter(m => m.favorite);
  const regularMeals = meals.filter(m => !m.favorite);

  let html = '';

  // UPDATED: Favorites section at the top
  if (favoriteMeals.length > 0) {
    html += `
      <div class="favorites-section" style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
          ⭐ Favorites (${favoriteMeals.length})
        </h3>
        <div class="scrollable-meals-window" style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
          <div class="meals-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            ${favoriteMeals.map(meal => renderMealCard(meal)).join('')}
          </div>
        </div>
      </div>
      <hr style="border: none; border-top: 2px solid var(--border-color); margin: 20px 0;">
    `;
  }

  // UPDATED: Regular meals in scrollable window grouped by type
  const mealsByType = {
    'Breakfast': regularMeals.filter(m => m.type === 'Breakfast'),
    'Lunch': regularMeals.filter(m => m.type === 'Lunch'),
    'Dinner': regularMeals.filter(m => m.type === 'Dinner'),
    'Snack': regularMeals.filter(m => m.type === 'Snack'),
    'Other': regularMeals.filter(m => !['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(m.type))
  };

  html += `<div class="scrollable-meals-window" style="max-height: 600px; overflow-y: auto; padding-right: 8px;">`;

  Object.entries(mealsByType).forEach(([type, typeMeals]) => {
    if (typeMeals.length === 0) return;

    html += `
      <div class="meal-type-section" style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">
          ${type} (${typeMeals.length})
        </h3>
        <div class="meals-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
          ${typeMeals.map(meal => renderMealCard(meal)).join('')}
        </div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;

  // Attach event listeners after rendering
  attachMealEventListeners();
}

/**
 * UPDATED: Render individual meal card with Log Meal button and category
 */
function renderMealCard(meal) {
  const favoriteIcon = meal.favorite ? '⭐' : '☆';
  const categoryDisplay = meal.category ? meal.category.charAt(0).toUpperCase() + meal.category.slice(1) : 'Other';
  const dietaryTags = renderDietaryTags(meal);

  return `
    <div class="meal-card" style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${meal.name}</div>
          <div style="font-size: 12px; color: #6366f1; font-weight: 600; margin-top: 2px;">${categoryDisplay}</div>
        </div>
        <button class="favorite-btn" data-meal-id="${meal.id}" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; margin-left: 8px;" title="Toggle Favorite">
          ${favoriteIcon}
        </button>
      </div>

      ${dietaryTags ? `
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
          ${dietaryTags}
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px; font-size: 13px;">
        <div>
          <span style="color: var(--text-secondary);">Calories:</span>
          <span style="font-weight: 600; color: var(--text-primary);"> ${meal.calories}</span>
        </div>
        <div>
          <span style="color: var(--text-secondary);">Protein:</span>
          <span style="font-weight: 600; color: var(--primary-color);"> ${meal.protein}g</span>
        </div>
        <div>
          <span style="color: var(--text-secondary);">Carbs:</span>
          <span style="font-weight: 600; color: var(--text-primary);"> ${meal.carbs}g</span>
        </div>
        <div>
          <span style="color: var(--text-secondary);">Fats:</span>
          <span style="font-weight: 600; color: var(--text-primary);"> ${meal.fats}g</span>
        </div>
      </div>

      ${meal.ingredients ? `
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
          <strong>Ingredients:</strong> ${meal.ingredients}
        </div>
      ` : ''}

      <!-- NEW: Action buttons -->
      <div style="display: flex; gap: 8px;">
        <button class="log-meal-btn" data-meal-id="${meal.id}" style="flex: 1; font-size: 12px; padding: 8px 12px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
          ✓ Log Meal
        </button>
        <button class="edit-meal-btn" data-meal-id="${meal.id}" style="font-size: 12px; padding: 8px 12px; background: #e2e8f0; color: #0f172a; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
          Edit
        </button>
        <button class="delete-meal-btn" data-meal-id="${meal.id}" style="font-size: 12px; padding: 8px 12px; background: #fee2e2; color: #dc2626; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
          Delete
        </button>
      </div>
    </div>
  `;
}

/**
 * UPDATED: Attach event listeners to meal cards (includes Log Meal button)
 */
function attachMealEventListeners() {
  // Favorite buttons
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealId = e.target.dataset.mealId || e.target.parentElement.dataset.mealId;
      if (mealId) {
        toggleFavorite(mealId);
      }
    });
  });

  // NEW: Log Meal buttons
  document.querySelectorAll('.log-meal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealId = e.target.dataset.mealId;
      if (mealId) {
        logMealConsumption(mealId);
        showNotification('Meal logged successfully!', 'success');
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-meal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealId = e.target.dataset.mealId;
      if (mealId && confirm('Are you sure you want to delete this meal?')) {
        deleteMeal(mealId);
        showNotification('Meal deleted', 'info');
      }
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-meal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealId = e.target.dataset.mealId;
      if (!mealId) return;
      const meal = getAllMeals().find(item => item.id === mealId);
      if (meal) {
        openEditMealModal(meal);
      }
    });
  });
}

function openEditMealModal(meal) {
  const modalHTML = `
    <div id="mealEditModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
          <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Edit Meal</h3>
        </div>
        <form id="mealEditForm" style="padding: 20px 24px;">
          <div class="form-group">
            <label class="form-label">Meal Name</label>
            <input type="text" id="mealEditName" class="form-input" required value="${meal.name}">
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="mealEditType" class="form-select" required>
                ${['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'].map(option => `
                  <option value="${option}" ${meal.type === option ? 'selected' : ''}>${option}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="mealEditCategory" class="form-select" required>
                ${['breakfast', 'lunch', 'dinner', 'snack', 'other'].map(option => `
                  <option value="${option}" ${meal.category === option ? 'selected' : ''}>${option.charAt(0).toUpperCase() + option.slice(1)}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div class="form-group">
              <label class="form-label">Calories</label>
              <input type="number" id="mealEditCalories" class="form-input" required step="1" value="${meal.calories}">
            </div>
            <div class="form-group">
              <label class="form-label">Protein (g)</label>
              <input type="number" id="mealEditProtein" class="form-input" required step="0.1" value="${meal.protein}">
            </div>
            <div class="form-group">
              <label class="form-label">Carbs (g)</label>
              <input type="number" id="mealEditCarbs" class="form-input" required step="0.1" value="${meal.carbs}">
            </div>
            <div class="form-group">
              <label class="form-label">Fats (g)</label>
              <input type="number" id="mealEditFats" class="form-input" required step="0.1" value="${meal.fats}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Dietary Tags</label>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
              ${Object.entries(DIETARY_TAG_LABELS).map(([value, label]) => `
                <label style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                  <input type="checkbox" name="mealDietaryTags" value="${value}" ${normalizeDietaryTags(meal.dietaryTags).includes(value) ? 'checked' : ''}>
                  ${label}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ingredients</label>
            <textarea id="mealEditIngredients" class="form-textarea" rows="2">${meal.ingredients || ''}</textarea>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
            <button type="button" id="mealEditCancel" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  const modal = document.getElementById('mealEditModal');
  const form = document.getElementById('mealEditForm');
  const cancelBtn = document.getElementById('mealEditCancel');

  const closeModal = () => {
    if (modalContainer.parentNode) {
      document.body.removeChild(modalContainer);
    }
  };

  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const updatedMeal = {
      name: document.getElementById('mealEditName').value,
      type: document.getElementById('mealEditType').value,
      category: document.getElementById('mealEditCategory').value,
      calories: document.getElementById('mealEditCalories').value,
      protein: document.getElementById('mealEditProtein').value,
      carbs: document.getElementById('mealEditCarbs').value,
      fats: document.getElementById('mealEditFats').value,
      dietaryTags: getSelectedDietaryTags(form),
      ingredients: document.getElementById('mealEditIngredients').value
    };

    updateMeal(meal.id, updatedMeal);
    showNotification('Meal updated successfully!', 'success');
    closeModal();
  });
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
