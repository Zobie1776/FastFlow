/**
 * Badges View UI Module
 */

import { BADGE_DEFINITIONS, getUnlockedBadges } from '../badges/badges.js';

export function renderBadgesView() {
  const unlockedBadges = getUnlockedBadges();
  const totalBadges = Object.keys(BADGE_DEFINITIONS).length;

  const container = document.getElementById('badgesContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="badge-stats">
      <div class="stat-card">
        <div class="stat-value">${unlockedBadges.length}</div>
        <div class="stat-label">Unlocked</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round((unlockedBadges.length / totalBadges) * 100)}%</div>
        <div class="stat-label">Complete</div>
      </div>
    </div>
    <div class="badges-grid">
      ${Object.values(BADGE_DEFINITIONS).map(badge => {
        const unlocked = unlockedBadges.find(b => b.badgeId === badge.badgeId);
        return `
          <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.displayName}</div>
            <div class="badge-description">${badge.description}</div>
            ${unlocked ? `<div class="badge-date">Unlocked ${new Date(unlocked.unlockedAt).toLocaleDateString()}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}
