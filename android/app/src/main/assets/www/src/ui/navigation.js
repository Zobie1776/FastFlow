/**
 * Navigation Module
 */

export function initializeNavigation() {
  const navSelect = document.getElementById('sectionSelect');
  if (!navSelect) return;

  navSelect.addEventListener('change', (e) => {
    showTab(e.target.value);
  });
}

export function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Update select
  const navSelect = document.getElementById('sectionSelect');
  if (navSelect) {
    navSelect.value = tabName;
  }

  // Dispatch tab change event
  window.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));
}
