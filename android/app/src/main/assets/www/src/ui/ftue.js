/**
 * First Time User Experience (FTUE) Module
 * Shows a skippable walkthrough on first launch
 */

import { storage } from '../state/storage.js';

const FTUE_COMPLETED_KEY = 'ftue_completed';
const FTUE_VERSION = '1.0';

/**
 * Check if FTUE should be shown
 */
export function shouldShowFTUE() {
  const completed = storage.getValue(FTUE_COMPLETED_KEY);
  return !completed || completed !== FTUE_VERSION;
}

/**
 * Mark FTUE as completed
 */
export function markFTUECompleted() {
  storage.setValue(FTUE_COMPLETED_KEY, FTUE_VERSION);
}

/**
 * Show FTUE walkthrough
 */
export function showFTUE() {
  if (!shouldShowFTUE()) return;

  const steps = [
    {
      title: 'Welcome to FastCore',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">🌟</div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
            <strong>FastCore</strong> helps you track intermittent fasting, workouts, meals, and body stats—all in one place.
          </p>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
            This quick walkthrough will show you how to get started.
          </p>
        </div>
      `
    },
    {
      title: 'Fasting Timers',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">⏰</div>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
            <strong>Choose a fasting protocol</strong> (like 16:8 or 18:6) and tap <strong>"Start Fast"</strong>.
          </p>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
            Your timer runs automatically, even if you close the app. When you're done fasting, tap "Stop Fast" to save your session.
          </p>
        </div>
      `
    },
    {
      title: 'Body Stats & Workouts',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">📊</div>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
            Track your <strong>weight, measurements, and progress photos</strong> in the Body Stats tab.
          </p>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
            Log <strong>workouts</strong> in the Exercise tab. Choose from pre-built plans or create custom sessions.
          </p>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
            Your progress is saved locally on this device.
          </p>
        </div>
      `
    },
    {
      title: 'Education & Guidance',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">📚</div>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
            The <strong>Education</strong> tab explains fasting protocols, metabolic phases, and training concepts like near-failure training.
          </p>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
            All educational content is informational only and not medical advice.
          </p>
        </div>
      `
    },
    {
      title: 'Progress & Badges',
      content: `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
            Unlock <strong>badges</strong> as you hit milestones—like completing your first fast, maintaining streaks, or reaching weight goals.
          </p>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
            Check the Badges tab to see what you've earned and what's next.
          </p>
        </div>
      `
    }
  ];

  showWalkthroughModal(steps);
}

/**
 * Show walkthrough modal with steps
 */
function showWalkthroughModal(steps) {
  let currentStep = 0;

  const modal = document.createElement('div');
  modal.id = 'ftueModal';
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
    z-index: 20000;
    padding: 20px;
  `;

  document.body.appendChild(modal);

  function renderStep() {
    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    modal.innerHTML = `
      <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);">
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="display: inline-flex; gap: 6px; margin-bottom: 16px;">
            ${steps.map((_, idx) => `
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${idx === currentStep ? 'var(--primary-color)' : 'var(--border-color)'};"></div>
            `).join('')}
          </div>
        </div>

        <h2 style="margin: 0 0 20px 0; font-size: 24px; text-align: center; color: var(--modal-text-primary);">
          ${step.title}
        </h2>

        <div style="margin-bottom: 32px; color: var(--modal-text-primary);">
          ${step.content}
        </div>

        <div style="display: flex; gap: 12px;">
          ${!isFirst ? `
            <button id="ftuePrevBtn" class="btn btn-outline" style="flex: 1;">
              Back
            </button>
          ` : ''}

          ${!isLast ? `
            <button id="ftueSkipBtn" class="btn btn-outline" style="flex: 1;">
              Skip
            </button>
            <button id="ftueNextBtn" class="btn btn-primary" style="flex: 2;">
              Next
            </button>
          ` : `
            <button id="ftueFinishBtn" class="btn btn-primary" style="flex: 1;">
              Get Started
            </button>
          `}
        </div>
      </div>
    `;

    // Event listeners
    const prevBtn = document.getElementById('ftuePrevBtn');
    const nextBtn = document.getElementById('ftueNextBtn');
    const skipBtn = document.getElementById('ftueSkipBtn');
    const finishBtn = document.getElementById('ftueFinishBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--;
          renderStep();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
          currentStep++;
          renderStep();
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        closeFTUE();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        closeFTUE();
      });
    }
  }

  function closeFTUE() {
    markFTUECompleted();
    modal.remove();
  }

  renderStep();
}

/**
 * Allow user to revisit FTUE from settings
 */
export function showFTUEFromSettings() {
  // Temporarily mark as incomplete to force show
  const originalValue = storage.getValue(FTUE_COMPLETED_KEY);
  storage.setValue(FTUE_COMPLETED_KEY, null);
  showFTUE();
  // Restore after modal is closed
  setTimeout(() => {
    storage.setValue(FTUE_COMPLETED_KEY, originalValue);
  }, 100);
}
