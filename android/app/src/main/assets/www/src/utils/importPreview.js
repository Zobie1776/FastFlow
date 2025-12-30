/**
 * Import Preview & Validation Utility
 * Reusable modal for previewing imports before confirmation
 */

/**
 * Normalize string for duplicate detection
 */
function normalizeForComparison(str) {
  return str.trim().toLowerCase();
}

/**
 * Detect duplicates in parsed items against existing items
 * @param {Array} parsedItems - Items to import
 * @param {Array} existingItems - Current items in storage
 * @param {string} nameField - Field name to compare (e.g., 'name')
 * @returns {Object} - { newItems, duplicates, duplicateCount }
 */
export function detectDuplicates(parsedItems, existingItems, nameField = 'name') {
  const existingNames = new Set(
    existingItems.map(item => normalizeForComparison(item[nameField]))
  );

  const newItems = [];
  const duplicates = [];

  parsedItems.forEach(item => {
    const normalizedName = normalizeForComparison(item[nameField]);
    if (existingNames.has(normalizedName)) {
      duplicates.push(item);
    } else {
      newItems.push(item);
    }
  });

  return {
    newItems,
    duplicates,
    duplicateCount: duplicates.length
  };
}

/**
 * Validate and clean import data
 * @param {Array} items - Items to validate
 * @param {string} nameField - Required field name
 * @returns {Object} - { valid, invalid, errors }
 */
export function validateImportData(items, nameField = 'name') {
  const valid = [];
  const invalid = [];
  const errors = [];

  if (!Array.isArray(items)) {
    return {
      valid: [],
      invalid: [],
      errors: ['Import data must be an array']
    };
  }

  items.forEach((item, index) => {
    // Check if item has required name field
    if (!item[nameField] || typeof item[nameField] !== 'string') {
      invalid.push(item);
      errors.push(`Item ${index + 1}: Missing or invalid ${nameField}`);
      return;
    }

    // Trim whitespace from name
    const trimmedName = item[nameField].trim();
    if (!trimmedName) {
      invalid.push(item);
      errors.push(`Item ${index + 1}: Empty ${nameField} after trimming`);
      return;
    }

    // Create cleaned item
    const cleanedItem = {
      ...item,
      [nameField]: trimmedName
    };

    valid.push(cleanedItem);
  });

  return { valid, invalid, errors };
}

/**
 * Show import preview modal
 * @param {Object} options - Configuration options
 * @returns {Promise} - Resolves with { confirmed, skipDuplicates } or rejects on cancel
 */
export function showImportPreview(options) {
  const {
    title = 'Import Preview',
    items = [],
    duplicates = [],
    itemType = 'items',
    renderItemSummary = (item) => item.name || 'Unnamed item'
  } = options;

  return new Promise((resolve, reject) => {
    // Create modal HTML
    const modalHTML = `
      <div id="importPreviewModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg-modal-overlay); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
        <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">

          <!-- Modal Header -->
          <div style="padding: 24px; border-bottom: 2px solid #e5e7eb;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1f2937;">${title}</h2>
          </div>

          <!-- Modal Body -->
          <div style="padding: 24px; overflow-y: auto; flex: 1;">

            <!-- Summary Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${items.length + duplicates.length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Total Detected</div>
              </div>
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #10b981;">${items.length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">New ${itemType}</div>
              </div>
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${duplicates.length}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Duplicates</div>
              </div>
            </div>

            <!-- Skip Duplicates Toggle -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="skipDuplicatesCheckbox" checked style="width: 18px; height: 18px; margin-right: 12px; cursor: pointer;">
                <div>
                  <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">Skip Duplicates</div>
                  <div style="font-size: 12px; color: #3b82f6;">Only import new ${itemType}, ignore items that already exist</div>
                </div>
              </label>
            </div>

            <!-- Items Preview -->
            ${items.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #10b981; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  ✓ New ${itemType} (${items.length})
                </h3>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #d1fae5; border-radius: 8px; padding: 12px; background: #f0fdf4;">
                  ${items.map(item => `
                    <div style="padding: 8px; border-bottom: 1px solid #d1fae5; font-size: 13px; color: #065f46;">
                      ${renderItemSummary(item)}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Duplicates Preview -->
            ${duplicates.length > 0 ? `
              <div>
                <h3 style="font-size: 14px; font-weight: 700; color: #f59e0b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  ⚠ Duplicates (${duplicates.length})
                </h3>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; background: #fffbeb;">
                  ${duplicates.map(item => `
                    <div style="padding: 8px; border-bottom: 1px solid #fde68a; font-size: 13px; color: #92400e; opacity: 0.7;">
                      ${renderItemSummary(item)}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${items.length === 0 && duplicates.length === 0 ? `
              <div style="text-align: center; padding: 32px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 12px;">📦</div>
                <div style="font-size: 14px;">No items to import</div>
              </div>
            ` : ''}

          </div>

          <!-- Modal Footer -->
          <div style="padding: 20px 24px; border-top: 2px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; background: #f9fafb;">
            <button id="cancelImportBtn" style="padding: 10px 24px; border: 2px solid var(--border-color); background: var(--bg-primary); border-radius: 8px; font-weight: 600; color: var(--text-primary); cursor: pointer; font-size: 14px;">
              Cancel
            </button>
            <button id="confirmImportBtn" ${items.length === 0 ? 'disabled' : ''} style="padding: 10px 24px; border: none; background: ${items.length === 0 ? '#d1d5db' : '#6366f1'}; color: white; border-radius: 8px; font-weight: 600; cursor: ${items.length === 0 ? 'not-allowed' : 'pointer'}; font-size: 14px;">
              Import ${items.length} ${itemType}
            </button>
          </div>

        </div>
      </div>
    `;

    // Inject modal into DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    const modal = document.getElementById('importPreviewModal');
    const confirmBtn = document.getElementById('confirmImportBtn');
    const cancelBtn = document.getElementById('cancelImportBtn');
    const skipCheckbox = document.getElementById('skipDuplicatesCheckbox');

    // Confirm handler
    confirmBtn.addEventListener('click', () => {
      const skipDuplicates = skipCheckbox.checked;
      document.body.removeChild(modalContainer);
      resolve({ confirmed: true, skipDuplicates });
    });

    // Cancel handler
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      reject({ confirmed: false });
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modalContainer);
        reject({ confirmed: false });
      }
    });

    // ESC key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', escHandler);
        reject({ confirmed: false });
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

/**
 * Helper: Render meal summary for preview
 */
export function renderMealSummary(meal) {
  // Capitalize category for display
  const categoryDisplay = meal.category ? meal.category.charAt(0).toUpperCase() + meal.category.slice(1) : '';
  const dietaryTags = Array.isArray(meal.dietaryTags) ? meal.dietaryTags : [];
  const dietaryLabels = {
    'high-protein': 'High Protein',
    keto: 'Keto / Low Carb',
    mixed: 'Mixed / Balanced'
  };
  const dietaryDisplay = dietaryTags
    .map(tag => dietaryLabels[tag] || tag)
    .filter(Boolean)
    .join(', ');

  return `
    <strong>${meal.name}</strong>
    ${categoryDisplay ? `<span style="color: #6366f1; font-weight: 600;"> • ${categoryDisplay}</span>` : ''}
    ${meal.calories ? `<span style="color: #6b7280;"> • ${meal.calories} cal</span>` : ''}
    ${meal.protein ? `<span style="color: #6b7280;"> • ${meal.protein}g protein</span>` : ''}
    ${dietaryDisplay ? `<span style="color: #6b7280;"> • ${dietaryDisplay}</span>` : ''}
  `;
}

/**
 * Helper: Render exercise summary for preview
 */
export function renderExerciseSummary(exercise) {
  return `
    <strong>${exercise.name}</strong>
    ${exercise.category ? `<span style="color: #6b7280;"> • ${exercise.category}</span>` : ''}
    ${exercise.difficulty ? `<span style="color: #6b7280;"> • ${exercise.difficulty}</span>` : ''}
  `;
}
