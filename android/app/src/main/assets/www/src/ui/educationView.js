/**
 * Education View UI Module
 */

import { getAllProtocols } from '../protocols/protocols.js';

const CATEGORY_ORDER = ['beginner', 'intermediate', 'advanced', 'extended'];
const CATEGORY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  extended: 'Extended'
};

export function initializeEducationView() {
  renderEducationProtocols();
  setupNearFailureInfoButton();
}

function setupNearFailureInfoButton() {
  const btn = document.getElementById('nearFailureInfoBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    showNearFailureModal();
  });
}

function showNearFailureModal() {
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
    <div class="modal-content" style="background: var(--modal-bg); color: var(--modal-text-primary); border-radius: 12px; padding: 24px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin: 0 0 16px 0; font-size: 20px; color: var(--modal-text-primary);">What is Near-Failure?</h3>

      <div style="font-size: 15px; line-height: 1.6; color: var(--modal-text-primary); margin-bottom: 16px;">
        <p style="margin: 0 0 12px 0;">
          <strong>Near-failure</strong> means performing an exercise until you could only complete 1–3 more reps with good form. You stop before your form breaks down.
        </p>

        <p style="margin: 0 0 12px 0;">
          Think of it this way: if you're doing push-ups and you feel like you could do 2 more reps with proper technique, that's near-failure. You don't need to go until you collapse or fail completely.
        </p>

        <div class="example-box" style="background: var(--bg-secondary); border-left: 4px solid var(--primary-color); padding: 12px; margin: 16px 0; border-radius: 4px; color: var(--modal-text-primary);">
          <strong style="display: block; margin-bottom: 6px; color: var(--primary-color);">Example:</strong>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--modal-text-primary);">
            You're doing bodyweight squats. After 15 reps, your legs are burning and you feel like you could maybe do 2 more with good form. Stop there. That's near-failure.
          </p>
        </div>

        <p style="margin: 0 0 12px 0;">
          This approach works the same whether you're using:
        </p>
        <ul style="margin: 0 0 12px 0; padding-left: 20px;">
          <li>Free weights (dumbbells, barbells)</li>
          <li>Machines at the gym</li>
          <li>Your own bodyweight (calisthenics)</li>
        </ul>

        <p style="margin: 0;">
          The effort level matters more than the equipment. Whether you're lifting 50 lbs or doing push-ups, the goal is to challenge your muscles with sets taken close to technical failure.
        </p>
      </div>

      <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
        <strong>Note:</strong> This is educational information only. Individual responses vary. Consult a healthcare provider before beginning any exercise program.
      </div>

      <button id="closeNearFailureModal" class="btn btn-primary btn-block">Got it</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  const closeBtn = document.getElementById('closeNearFailureModal');
  closeBtn.addEventListener('click', () => modal.remove());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

export function renderEducationProtocols() {
  const container = document.getElementById('educationProtocols');
  if (!container) return;

  const protocols = getAllProtocols()
    .filter((protocol) => protocol.protocolId !== 'custom')
    .filter((protocol) => Number.isFinite(protocol.educationOrder))
    .sort((a, b) => a.educationOrder - b.educationOrder);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: protocols.filter((protocol) => protocol.educationCategory === category)
  }));

  container.innerHTML = grouped.map((group) => {
    if (!group.items.length) return '';
    return `
      <div class="education-protocol-group">
        <div class="education-protocol-title">${CATEGORY_LABELS[group.category]}</div>
        <ul class="education-protocol-list">
          ${group.items.map((protocol) => renderProtocolItem(protocol)).join('')}
        </ul>
      </div>
    `;
  }).join('');

  console.info('✅ Educational fasting protocols ordered and categorized correctly (FastFlow)');
}

function renderProtocolItem(protocol) {
  const ratio = formatProtocolRatio(protocol);
  const description = protocol.description || '';
  const beginnerBadge = protocol.beginnerFriendly
    ? '<span class="education-protocol-badge">Beginner-friendly</span>'
    : '';

  return `
    <li class="education-protocol-item">
      <strong>${ratio}</strong> ${description} ${beginnerBadge}
    </li>
  `;
}

function formatProtocolRatio(protocol) {
  if (protocol.protocolId === '24_plus') {
    return '24+';
  }
  return `${protocol.fastingHours}:${protocol.eatingHours}`;
}
