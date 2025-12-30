/**
 * Body Stats View UI Module
 */

import {
  getBodyStats,
  addBodyStat,
  getWeightProgressData,
  getWeightChangeStats,
  getWeightUnit,
  setWeightUnit,
  getGoalWeight,
  setGoalWeight,
  convertToLb,
  convertFromLb
} from '../bodyStats/bodyStats.js';

export function initializeBodyStatsView() {
  setupBodyStatForm();
  setupGoalWeightSection();
  setupProgressHistoryButton();
  renderBodyStatsTable();
  renderWeightGraph();
  renderGoalWeightProgress();

  // FIX 2: Listen for body stats updates and re-render graph immediately
  window.addEventListener('bodyStatsUpdated', () => {
    renderBodyStatsTable();
    renderWeightGraph();
    renderGoalWeightProgress();
  });
}

function setupProgressHistoryButton() {
  const btn = document.getElementById('viewProgressHistoryBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    showProgressHistoryModal();
  });
}

function showProgressHistoryModal() {
  const stats = getBodyStats().sort((a, b) => new Date(a.date) - new Date(b.date));
  const statsWithPhotos = stats.filter(s => s.photoUrls && s.photoUrls.length > 0);

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

  const unit = getWeightUnit();

  if (statsWithPhotos.length === 0) {
    modal.innerHTML = `
      <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 12px; padding: 24px; max-width: 500px; width: 100%;">
        <h3 style="margin: 0 0 16px 0; font-size: 20px; color: var(--modal-text-primary);">Progress Photos</h3>
        <div style="text-align: center; padding: 32px; color: var(--modal-text-secondary);">
          <div style="font-size: 48px; margin-bottom: 16px;">📷</div>
          <p>No progress photos yet. Add photos when logging body stats to track your visual progress over time.</p>
        </div>
        <button id="closeProgressModal" class="btn btn-primary btn-block">Close</button>
      </div>
    `;
  } else {
    const presets = generatePhotoPresets(statsWithPhotos);

    modal.innerHTML = `
      <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 12px; padding: 24px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 style="margin: 0 0 16px 0; font-size: 20px; color: var(--modal-text-primary);">Progress Photos</h3>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Quick Compare:</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${presets.map(preset => `
              <button class="btn btn-outline preset-btn" data-preset='${JSON.stringify(preset)}'>
                ${preset.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Or Select Dates Manually:</label>
          <div id="dateSelectionContainer" style="display: grid; gap: 12px; max-height: 200px; overflow-y: auto; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px;">
            ${statsWithPhotos.map((stat, idx) => `
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <input type="checkbox" class="date-checkbox" data-index="${idx}" style="cursor: pointer;">
                <div style="flex: 1;">
                  <div style="font-weight: 600;">${new Date(stat.date).toLocaleDateString()}</div>
                  <div style="font-size: 13px; color: var(--text-secondary);">
                    ${stat.weight ? `${convertFromLb(stat.weight, unit).toFixed(1)} ${unit}` : 'No weight'} •
                    ${stat.photoUrls.length} photo${stat.photoUrls.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </label>
            `).join('')}
          </div>
          <button id="compareSelectedBtn" class="btn btn-primary btn-block" style="margin-top: 12px;">Compare Selected</button>
        </div>

        <div id="comparisonContainer" style="display: none; margin-top: 20px; border-top: 2px solid var(--border-color); padding-top: 20px;">
          <!-- Comparison will be inserted here -->
        </div>

        <button id="closeProgressModal" class="btn btn-outline btn-block" style="margin-top: 16px;">Close</button>
      </div>
    `;
  }

  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = document.getElementById('closeProgressModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const preset = JSON.parse(e.target.dataset.preset);
      const selectedStats = preset.indices.map(i => statsWithPhotos[i]);
      renderComparison(selectedStats, unit);
    });
  });

  // Manual comparison
  const compareBtn = document.getElementById('compareSelectedBtn');
  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.date-checkbox:checked');
      if (checkboxes.length === 0) {
        alert('Please select at least one date to compare');
        return;
      }
      const selectedStats = Array.from(checkboxes).map(cb =>
        statsWithPhotos[parseInt(cb.dataset.index)]
      );
      renderComparison(selectedStats, unit);
    });
  }
}

function generatePhotoPresets(statsWithPhotos) {
  const presets = [];

  if (statsWithPhotos.length >= 2) {
    // Start → Current
    presets.push({
      label: 'Start → Current',
      indices: [0, statsWithPhotos.length - 1]
    });
  }

  if (statsWithPhotos.length >= 3) {
    // First, Middle, Last
    const midIdx = Math.floor(statsWithPhotos.length / 2);
    presets.push({
      label: 'Start → Mid → Current',
      indices: [0, midIdx, statsWithPhotos.length - 1]
    });
  }

  // Month-to-month (if applicable)
  const monthlyStats = [];
  let currentMonth = null;
  statsWithPhotos.forEach((stat, idx) => {
    const month = new Date(stat.date).toISOString().substring(0, 7);
    if (month !== currentMonth) {
      currentMonth = month;
      monthlyStats.push(idx);
    }
  });

  if (monthlyStats.length >= 2) {
    presets.push({
      label: 'Monthly Progress',
      indices: monthlyStats
    });
  }

  return presets;
}

function renderComparison(selectedStats, unit) {
  const container = document.getElementById('comparisonContainer');
  if (!container) return;

  container.style.display = 'block';
  container.innerHTML = `
    <h4 style="margin: 0 0 16px 0; color: var(--modal-text-primary);">Comparison</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
      ${selectedStats.map(stat => `
        <div style="border: 2px solid var(--border-color); border-radius: 8px; padding: 12px; background: var(--bg-secondary);">
          <div style="font-weight: 700; margin-bottom: 8px; text-align: center; color: var(--modal-text-primary);">
            ${new Date(stat.date).toLocaleDateString()}
          </div>

          <div style="display: grid; gap: 8px; margin-bottom: 12px;">
            ${stat.photoUrls.map(url => `
              <img src="${url}" alt="Progress photo" style="width: 100%; border-radius: 6px; border: 1px solid var(--border-color);">
            `).join('')}
          </div>

          <div style="font-size: 13px; color: var(--modal-text-secondary); line-height: 1.6;">
            ${stat.weight ? `<div><strong>Weight:</strong> ${convertFromLb(stat.weight, unit).toFixed(1)} ${unit}</div>` : ''}
            ${stat.waist ? `<div><strong>Waist:</strong> ${stat.waist}"</div>` : ''}
            ${stat.chest ? `<div><strong>Chest:</strong> ${stat.chest}"</div>` : ''}
            ${stat.hips ? `<div><strong>Hips:</strong> ${stat.hips}"</div>` : ''}
            ${stat.arms ? `<div><strong>Arms:</strong> ${stat.arms}"</div>` : ''}
            ${stat.energy ? `<div><strong>Energy:</strong> ${stat.energy}/10</div>` : ''}
            ${stat.mood ? `<div><strong>Mood:</strong> ${stat.mood}/10</div>` : ''}
          </div>

          ${stat.notes ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color); font-size: 12px; font-style: italic; color: var(--text-secondary);">
              "${stat.notes}"
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    ${selectedStats.length >= 2 && selectedStats[0].weight && selectedStats[selectedStats.length - 1].weight ? `
      <div class="example-box" style="background: var(--bg-secondary); border-left: 4px solid var(--primary-color); padding: 12px; margin-top: 16px; border-radius: 4px; color: var(--modal-text-primary);">
        <strong style="display: block; margin-bottom: 4px; color: var(--modal-text-primary);">Overall Change:</strong>
        <div style="font-size: 14px; color: var(--modal-text-primary);">
          Weight: ${convertFromLb(selectedStats[0].weight, unit).toFixed(1)} ${unit} →
          ${convertFromLb(selectedStats[selectedStats.length - 1].weight, unit).toFixed(1)} ${unit}
          (${(convertFromLb(selectedStats[selectedStats.length - 1].weight, unit) - convertFromLb(selectedStats[0].weight, unit)).toFixed(1)} ${unit})
        </div>
      </div>
    ` : ''}
  `;

  // Scroll to comparison
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setupBodyStatForm() {
  const form = document.getElementById('bodyStatForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const unit = getWeightUnit();
    const goalInput = document.getElementById('goalWeightInput');
    const goalValue = goalInput ? goalInput.value : '';

    const photoInput = document.getElementById('statPhotos');
    const photos = photoInput?.files ? Array.from(photoInput.files) : [];
    const photoUrls = await Promise.all(photos.map(file => readFileAsDataUrl(file)));

    const entry = {
      date: document.getElementById('statDate').value,
      weight: convertToLb(parseFloat(document.getElementById('statWeight').value), unit),
      waist: document.getElementById('statWaist').value,
      chest: document.getElementById('statChest').value,
      hips: document.getElementById('statHips').value,
      arms: document.getElementById('statArms').value,
      thighs: document.getElementById('statThighs').value,
      energy: document.getElementById('statEnergy').value,
      mood: document.getElementById('statMood').value,
      notes: document.getElementById('statNotes').value,
      photoUrls
    };

    addBodyStat(entry);
    form.reset();
    if (goalInput) {
      goalInput.value = goalValue;
    }
    restoreWeightUnitSelection();
    renderBodyStatsTable();
    renderWeightGraph();
    renderGoalWeightProgress();

    console.log('Body stat added');
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function renderBodyStatsTable() {
  const stats = getBodyStats().sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('bodyStatsTable');
  const unit = getWeightUnit();

  if (!container) return;

  if (stats.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 32px;">No entries yet</p>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Weight (${unit})</th>
          <th>Waist</th>
          <th>Photos</th>
          <th>Energy</th>
          <th>Mood</th>
        </tr>
      </thead>
      <tbody>
        ${stats.map(stat => `
          <tr>
            <td>${stat.date}</td>
            <td><strong>${stat.weight ? formatWeight(stat.weight, unit) + ' ' + unit : '-'}</strong></td>
            <td>${stat.waist ? stat.waist + '"' : '-'}</td>
            <td>
              ${stat.photoUrls && stat.photoUrls.length > 0 ? `
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  ${stat.photoUrls.map(url => `
                    <img src="${url}" alt="Progress photo" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;">
                  `).join('')}
                </div>
              ` : '-'}
            </td>
            <td>${stat.energy ? stat.energy + '/10' : '-'}</td>
            <td>${stat.mood ? stat.mood + '/10' : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderWeightGraph() {
  const canvas = document.getElementById('bodyWeightChart');
  if (!canvas) return;

  const data = getWeightProgressData();
  const unit = getWeightUnit();
  const weights = data.weights.map(weight => formatWeight(weight, unit));

  // FIX 2: Properly destroy existing chart before re-rendering
  if (window.bodyWeightChartInstance) {
    window.bodyWeightChartInstance.destroy();
    window.bodyWeightChartInstance = null;
  }

  if (data.weights.length === 0) {
    // Don't destroy the canvas, just hide it and show empty message
    canvas.style.display = 'none';
    let emptyMsg = canvas.parentElement.querySelector('.empty-graph-message');
    if (!emptyMsg) {
      emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-graph-message';
      emptyMsg.style.cssText = 'text-align: center; padding: 32px;';
      emptyMsg.textContent = 'Add weight entries to see progress';
      canvas.parentElement.appendChild(emptyMsg);
    }
    emptyMsg.style.display = 'block';
    return;
  }

  // Hide empty message and show canvas
  canvas.style.display = 'block';
  const emptyMsg = canvas.parentElement.querySelector('.empty-graph-message');
  if (emptyMsg) {
    emptyMsg.style.display = 'none';
  }

  const ctx = canvas.getContext('2d');

  // Create new chart instance
  window.bodyWeightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: `Weight (${unit})`,
        data: weights,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

function setupGoalWeightSection() {
  const unitInputs = document.querySelectorAll('input[name="weightUnit"]');
  const goalInput = document.getElementById('goalWeightInput');

  const currentUnit = getWeightUnit();
  unitInputs.forEach(input => {
    input.checked = input.value === currentUnit;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      const previousUnit = getWeightUnit();
      const nextUnit = input.value;
      if (previousUnit === nextUnit) return;
      setWeightUnit(nextUnit);
      convertWeightInputValue(previousUnit, nextUnit);
      convertGoalInputValue(previousUnit, nextUnit);
      updateWeightUnitLabel();
      renderBodyStatsTable();
      renderWeightGraph();
      renderGoalWeightProgress();
    });
  });

  if (goalInput) {
    const storedGoal = getGoalWeight();
    if (storedGoal !== null) {
      goalInput.value = formatWeight(storedGoal, currentUnit);
    }

    goalInput.addEventListener('input', () => {
      const value = parseFloat(goalInput.value);
      const weightLb = convertToLb(value, getWeightUnit());
      setGoalWeight(weightLb);
      renderGoalWeightProgress();
    });
  }

  updateWeightUnitLabel();
}

function updateWeightUnitLabel() {
  const unit = getWeightUnit();
  const weightLabel = document.getElementById('weightUnitLabel');
  if (weightLabel) {
    weightLabel.textContent = `Weight (${unit})`;
  }
}

function restoreWeightUnitSelection() {
  const unit = getWeightUnit();
  const unitInputs = document.querySelectorAll('input[name="weightUnit"]');
  unitInputs.forEach(input => {
    input.checked = input.value === unit;
  });
  updateWeightUnitLabel();
}

function convertWeightInputValue(fromUnit, toUnit) {
  const weightInput = document.getElementById('statWeight');
  if (!weightInput || !weightInput.value) return;
  const value = parseFloat(weightInput.value);
  if (!Number.isFinite(value)) return;
  const valueLb = convertToLb(value, fromUnit);
  weightInput.value = formatWeight(valueLb, toUnit);
}

function convertGoalInputValue(fromUnit, toUnit) {
  const goalInput = document.getElementById('goalWeightInput');
  if (!goalInput || !goalInput.value) return;
  const value = parseFloat(goalInput.value);
  if (!Number.isFinite(value)) return;
  const valueLb = convertToLb(value, fromUnit);
  goalInput.value = formatWeight(valueLb, toUnit);
}

function renderGoalWeightProgress() {
  const progressEl = document.getElementById('goalWeightProgress');
  if (!progressEl) return;

  const goalWeightLb = getGoalWeight();
  const stats = getWeightChangeStats();
  const unit = getWeightUnit();

  if (!goalWeightLb || !stats.currentWeight) {
    progressEl.textContent = '';
    return;
  }

  const remainingLb = stats.currentWeight - goalWeightLb;
  if (remainingLb <= 0) {
    progressEl.textContent = 'Goal reached!';
    return;
  }

  const remaining = formatWeight(remainingLb, unit);
  progressEl.textContent = `${remaining} ${unit} remaining to goal`;
}

function formatWeight(weightLb, unit) {
  const value = convertFromLb(weightLb, unit);
  if (!Number.isFinite(value)) return '';
  return Math.round(value * 10) / 10;
}
