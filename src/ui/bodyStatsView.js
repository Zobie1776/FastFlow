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
