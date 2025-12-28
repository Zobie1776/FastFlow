/**
 * Meal Library Management Module
 * RESTORED: Full meal functionality with defaults and import support
 */

import { storage, COLLECTIONS } from '../state/storage.js';
import { generateUUID, getDeviceId } from '../state/device.js';
import { checkAndAwardBadges } from '../badges/badges.js';

// RESTORED: Default meals loaded on first run
const DEFAULT_MEALS = [
  {
    name: "Protein Pancakes",
    type: "Breakfast",
    category: "breakfast",
    protein: 28,
    calories: 340,
    carbs: 42,
    fats: 8,
    ingredients: "1 scoop protein powder, 2 eggs, 1/2 cup oats, 1/4 cup almond milk, 1/2 banana, cinnamon",
    favorite: false
  },
  {
    name: "Avocado Toast with Poached Eggs",
    type: "Breakfast",
    category: "breakfast",
    protein: 22,
    calories: 390,
    carbs: 28,
    fats: 20,
    ingredients: "2 slices whole grain bread, 1/2 avocado mashed, 2 poached eggs, everything bagel seasoning",
    favorite: false
  },
  {
    name: "Chicken Caesar Salad",
    type: "Lunch",
    category: "lunch",
    protein: 38,
    calories: 420,
    carbs: 18,
    fats: 22,
    ingredients: "6oz grilled chicken breast, romaine lettuce, 2 tbsp Caesar dressing, parmesan cheese, croutons",
    favorite: false
  },
  {
    name: "Turkey and Hummus Wrap",
    type: "Lunch",
    category: "lunch",
    protein: 32,
    calories: 380,
    carbs: 35,
    fats: 12,
    ingredients: "Whole wheat tortilla, 4oz sliced turkey breast, 3 tbsp hummus, lettuce, tomato, cucumber",
    favorite: false
  },
  {
    name: "Grilled Salmon with Quinoa",
    type: "Dinner",
    category: "dinner",
    protein: 42,
    calories: 480,
    carbs: 35,
    fats: 18,
    ingredients: "6oz salmon fillet, 1 cup cooked quinoa, roasted asparagus, lemon, olive oil",
    favorite: false
  },
  {
    name: "Chicken Stir-Fry",
    type: "Dinner",
    category: "dinner",
    protein: 40,
    calories: 450,
    carbs: 48,
    fats: 10,
    ingredients: "6oz grilled chicken, 1 cup brown rice, stir-fry vegetables, teriyaki sauce, sesame seeds",
    favorite: false
  },
  {
    name: "Greek Yogurt Parfait",
    type: "Snack",
    category: "snack",
    protein: 20,
    calories: 280,
    carbs: 38,
    fats: 6,
    ingredients: "1 cup Greek yogurt, 1/2 cup granola, mixed berries, honey drizzle",
    favorite: false
  },
  {
    name: "Protein Smoothie",
    type: "Snack",
    category: "snack",
    protein: 30,
    calories: 320,
    carbs: 35,
    fats: 8,
    ingredients: "1 scoop protein powder, 1 banana, 1 cup almond milk, 1 tbsp peanut butter, ice",
    favorite: false
  },
  {
    name: "Beef and Broccoli Bowl",
    type: "Dinner",
    category: "dinner",
    protein: 45,
    calories: 520,
    carbs: 42,
    fats: 16,
    ingredients: "6oz lean beef, steamed broccoli, 1 cup white rice, soy sauce, garlic, ginger",
    favorite: false
  },
  {
    name: "Egg White Omelette",
    type: "Breakfast",
    category: "breakfast",
    protein: 25,
    calories: 220,
    carbs: 8,
    fats: 8,
    ingredients: "6 egg whites, spinach, mushrooms, tomatoes, low-fat cheese",
    favorite: false
  }
];

/**
 * Initialize default meals on first run
 */
export function initializeDefaultMeals() {
  const meals = storage.get(COLLECTIONS.MEALS);

  if (!meals || meals.length === 0) {
    console.log('📝 Initializing default meals...');

    DEFAULT_MEALS.forEach(mealData => {
      const meal = createMealObject(mealData);
      storage.add(COLLECTIONS.MEALS, meal);
    });

    console.log(`✅ ${DEFAULT_MEALS.length} default meals loaded`);
  }
}

/**
 * Get all meals
 */
export function getAllMeals() {
  return storage.get(COLLECTIONS.MEALS).map(meal => ({
    ...meal,
    dietaryTags: normalizeDietaryTags(meal.dietaryTags)
  }));
}

/**
 * Supported meal categories
 */
export const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];
export const DIETARY_TAGS = ['high-protein', 'keto', 'mixed'];

const DIETARY_TAG_ALIASES = {
  'high protein': 'high-protein',
  'high-protein': 'high-protein',
  protein: 'high-protein',
  keto: 'keto',
  'keto / low carb': 'keto',
  'low carb': 'keto',
  'low-carb': 'keto',
  mixed: 'mixed',
  balanced: 'mixed',
  'mixed / balanced': 'mixed'
};

/**
 * Normalize category value
 * @param {string} category - Raw category input
 * @returns {string} Normalized category (lowercase)
 */
function normalizeCategory(category) {
  if (!category) return 'other';
  const normalized = category.toLowerCase().trim();
  return MEAL_CATEGORIES.includes(normalized) ? normalized : 'other';
}

function normalizeDietaryTag(tag) {
  if (!tag) return null;
  const normalized = tag.toLowerCase().trim();
  if (DIETARY_TAG_ALIASES[normalized]) {
    return DIETARY_TAG_ALIASES[normalized];
  }
  return DIETARY_TAGS.includes(normalized) ? normalized : null;
}

function normalizeDietaryTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return ['high-protein'];
  }
  const normalized = tags
    .map(tag => normalizeDietaryTag(tag))
    .filter(Boolean);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ['high-protein'];
}

/**
 * Create cloud-sync ready meal object
 */
function createMealObject(data) {
  return {
    // Unique identifiers (cloud-sync ready)
    id: data.id || generateUUID(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: data.syncStatus || 'local',
    deviceId: getDeviceId(),

    // Meal data
    name: data.name,
    type: data.type || 'Other',
    category: normalizeCategory(data.category || data.type),
    protein: parseFloat(data.protein) || 0,
    calories: parseFloat(data.calories) || 0,
    carbs: parseFloat(data.carbs) || 0,
    fats: parseFloat(data.fats) || 0,
    ingredients: data.ingredients || '',
    dietaryTags: normalizeDietaryTags(data.dietaryTags),
    favorite: data.favorite || false
  };
}

/**
 * Add a new meal
 */
export function addMeal(mealData) {
  const meal = createMealObject(mealData);

  storage.add(COLLECTIONS.MEALS, meal);
  checkAndAwardBadges('meal_logged', meal);

  // RESTORED: Emit event for UI updates
  window.dispatchEvent(new CustomEvent('mealsUpdated', { detail: { action: 'added', meal } }));

  return meal;
}

/**
 * Delete a meal
 */
export function deleteMeal(id) {
  const result = storage.delete(COLLECTIONS.MEALS, id);

  // RESTORED: Emit event for UI updates
  window.dispatchEvent(new CustomEvent('mealsUpdated', { detail: { action: 'deleted', id } }));

  return result;
}

/**
 * Update a meal
 */
export function updateMeal(id, updates) {
  const normalizedUpdates = { ...updates };
  if ('category' in updates || 'type' in updates) {
    normalizedUpdates.category = normalizeCategory(updates.category || updates.type);
  }
  if ('dietaryTags' in updates) {
    normalizedUpdates.dietaryTags = normalizeDietaryTags(updates.dietaryTags);
  }

  const updated = storage.update(COLLECTIONS.MEALS, id, normalizedUpdates);
  const meals = getAllMeals();
  const meal = meals.find(m => m.id === id);

  if (updated && meal) {
    window.dispatchEvent(new CustomEvent('mealsUpdated', { detail: { action: 'updated', meal } }));
  }

  return meal;
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(id) {
  const meals = getAllMeals();
  const meal = meals.find(m => m.id === id);

  if (meal) {
    meal.favorite = !meal.favorite;
    meal.updatedAt = new Date().toISOString();
    storage.update(COLLECTIONS.MEALS, id, meal);

    window.dispatchEvent(new CustomEvent('mealsUpdated', { detail: { action: 'updated', meal } }));
  }

  return meal;
}

/**
 * RESTORED: Import meals from JSON
 */
export function importMealsFromJSON(jsonData) {
  try {
    const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const mealsArray = Array.isArray(parsedData) ? parsedData : [parsedData];

    const imported = [];
    const existing = getAllMeals();

    mealsArray.forEach(mealData => {
      // Basic duplicate detection (by name)
      const isDuplicate = existing.some(m => m.name.toLowerCase() === mealData.name.toLowerCase());

      if (!isDuplicate) {
        const meal = addMeal(mealData);
        imported.push(meal);
      }
    });

    console.log(`✅ Imported ${imported.length} meals (${mealsArray.length - imported.length} duplicates skipped)`);
    return { imported: imported.length, skipped: mealsArray.length - imported.length };
  } catch (error) {
    console.error('Error importing meals from JSON:', error);
    throw error;
  }
}

/**
 * RESTORED: Import meals from text/markdown format
 * Format:
 * MEAL: Name
 * Type: Breakfast|Lunch|Dinner|Snack
 * Protein: XXg
 * Calories: XXX
 * Carbs: XXg
 * Fats: XXg
 * Ingredients: ...
 */
export function importMealsFromText(textContent) {
  try {
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

      if (meal.name && meal.calories) {
        meals.push(meal);
      }
    });

    if (meals.length > 0) {
      return importMealsFromJSON(meals);
    }

    throw new Error('No valid meals found in text format');
  } catch (error) {
    console.error('Error importing meals from text:', error);
    throw error;
  }
}

/**
 * RESTORED: Get meals by type
 */
export function getMealsByType(type) {
  return getAllMeals().filter(m => m.type === type);
}

/**
 * NEW: Get meals by category
 * @param {string} category - Category filter (lowercase)
 * @returns {array} Filtered meals
 */
export function getMealsByCategory(category) {
  if (!category || category === 'all') {
    return getAllMeals();
  }
  return getAllMeals().filter(m => m.category === normalizeCategory(category));
}

/**
 * RESTORED: Get favorite meals
 */
export function getFavoriteMeals() {
  return getAllMeals().filter(m => m.favorite);
}

/**
 * NEW: Meal Logging & Diversity Tracking
 */

/**
 * Log a meal consumption (tracking when a meal was eaten)
 */
export function logMealConsumption(mealId, date = null) {
  const consumptionDate = date || new Date().toISOString().split('T')[0];

  const logEntry = {
    id: generateUUID(),
    mealId: mealId,
    date: consumptionDate,
    loggedAt: new Date().toISOString(),
    syncStatus: 'local',
    deviceId: getDeviceId()
  };

  storage.add(COLLECTIONS.MEAL_LOGS, logEntry);
  checkAndAwardBadges('meal_consumption_logged', logEntry);

  // Emit event for UI updates
  window.dispatchEvent(new CustomEvent('mealLogsUpdated', { detail: { action: 'added', logEntry } }));

  return logEntry;
}

/**
 * Get all meal consumption logs
 */
export function getAllMealLogs() {
  return storage.get(COLLECTIONS.MEAL_LOGS).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Delete a meal log
 */
export function deleteMealLog(id) {
  const result = storage.delete(COLLECTIONS.MEAL_LOGS, id);
  window.dispatchEvent(new CustomEvent('mealLogsUpdated', { detail: { action: 'deleted', id } }));
  return result;
}

/**
 * NEW: Calculate meal diversity score (7-day rolling window)
 * Formula:
 * - Each unique meal per day = +1 point
 * - Max 3 points per day
 * - Weekly max = 21 points
 */
export function calculateMealDiversity() {
  const logs = getAllMealLogs();

  if (logs.length === 0) {
    return {
      weeklyScore: 0,
      maxScore: 21,
      percentage: 0,
      uniqueMealsThisWeek: 0,
      daysWithVariety: 0
    };
  }

  // Get logs from last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

  const recentLogs = logs.filter(log => log.date >= sevenDaysAgoString);

  // Group by date
  const logsByDate = {};
  recentLogs.forEach(log => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = [];
    }
    logsByDate[log.date].push(log);
  });

  // Calculate score
  let weeklyScore = 0;
  let daysWithVariety = 0; // Days with at least 2 unique meals
  const uniqueMealsSet = new Set();

  Object.entries(logsByDate).forEach(([date, dayLogs]) => {
    // Get unique meals for this day
    const uniqueMealsToday = new Set(dayLogs.map(log => log.mealId));
    const dailyScore = Math.min(uniqueMealsToday.size, 3);

    weeklyScore += dailyScore;
    uniqueMealsToday.forEach(mealId => uniqueMealsSet.add(mealId));

    if (uniqueMealsToday.size >= 2) {
      daysWithVariety++;
    }
  });

  return {
    weeklyScore,
    maxScore: 21,
    percentage: Math.round((weeklyScore / 21) * 100),
    uniqueMealsThisWeek: uniqueMealsSet.size,
    daysWithVariety,
    hasVarietyStreak: daysWithVariety >= 7 // 7-day variety streak
  };
}

/**
 * NEW: Get meal diversity score (convenience wrapper)
 */
export function getMealDiversityScore() {
  return calculateMealDiversity();
}
