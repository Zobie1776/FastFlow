/**
 * Fasting History View UI Module
 */

import { getSessionsSorted } from '../fasting/sessions.js';

export function initializeHistoryView() {
  renderHistoryView();

  window.addEventListener('fastingHistoryUpdated', () => {
    renderHistoryView();
  });
}

export function renderHistoryView() {
  const container = document.getElementById('historyContainer');
  if (!container) return;

  const sessions = getSessionsSorted();

  if (!sessions.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-text">No completed fasts yet</div>
      </div>
    `;
    return;
  }

  container.innerHTML = sessions.map((session) => {
    const start = new Date(session.startTime || session.fastStartTime || session.createdAt);
    const end = new Date(session.actualEndTime || session.endTime || session.updatedAt || session.createdAt);
    const durationMs = Number.isFinite(session.durationMs)
      ? session.durationMs
      : Math.max(0, end.getTime() - start.getTime());

    const protocolName = session.protocolName || session.protocolId || 'Custom';
    const timeWindow = `${formatTime(start)} → ${formatTime(end)}`;
    const completedDate = formatDate(end);

    return `
      <div class="session-card">
        <div class="session-header">
          <div class="session-date">${protocolName}</div>
          <div class="session-duration">${formatDuration(durationMs)}</div>
        </div>
        <div class="session-protocol">${timeWindow}</div>
        <div class="session-protocol">Completed: ${completedDate}</div>
      </div>
    `;
  }).join('');
}

function formatDuration(durationMs) {
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}
