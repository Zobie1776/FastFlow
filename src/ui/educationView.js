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
