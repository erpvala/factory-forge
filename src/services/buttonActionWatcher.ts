// @ts-nocheck

const INCIDENT_KEY = 'button_action_guard_incidents';

const pushIncident = (detail: Record<string, unknown>) => {
  try {
    const current = JSON.parse(localStorage.getItem(INCIDENT_KEY) || '[]');
    const next = [...(Array.isArray(current) ? current : []), detail].slice(-100);
    localStorage.setItem(INCIDENT_KEY, JSON.stringify(next));
  } catch {
    // Keep watcher resilient.
  }

  window.dispatchEvent(new CustomEvent('sv:button-action-incident', { detail }));
  console.error('[BUTTON_ACTION_GUARD]', detail);
};

const isValidActionButton = (el: HTMLElement) => {
  if (el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true') return true;
  if (el.tagName.toLowerCase() === 'a') return true;
  if (el.getAttribute('href')) return true;
  if (el.getAttribute('data-action')) return true;
  if (el.getAttribute('data-api')) return true;
  if (el.getAttribute('type') === 'submit') return true;
  if (el.getAttribute('onclick')) return true;
  if (el.getAttribute('role') === 'link') return true;
  return false;
};

export const installButtonActionWatcher = () => {
  if (typeof window === 'undefined') return () => {};

  const clickHandler = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const button = target.closest('button, [role="button"], a') as HTMLElement | null;
    if (!button) return;

    if (isValidActionButton(button)) return;

    const detail = {
      reason: 'missing_button_action',
      text: button.textContent?.trim().slice(0, 120) || '<empty>',
      className: button.className || '',
      timestamp: new Date().toISOString(),
    };

    event.preventDefault();
    event.stopPropagation();
    pushIncident(detail);
    alert('Blocked unsafe UI action: button has no action mapping.');
  };

  document.addEventListener('click', clickHandler, true);

  return () => {
    document.removeEventListener('click', clickHandler, true);
  };
};
