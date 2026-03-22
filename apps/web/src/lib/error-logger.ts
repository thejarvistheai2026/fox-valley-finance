/**
 * Simple error logging utility
 * Standalone module to avoid circular dependencies
 */

interface ErrorLogEntry {
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

const ERROR_LOG_KEY = 'fox_valley_error_log';
const MAX_ERRORS = 100;

export function logError(error: ErrorLogEntry) {
  try {
    const existing = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    const updated = [error, ...existing].slice(0, MAX_ERRORS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function getErrorLog(): ErrorLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearErrorLog() {
  localStorage.removeItem(ERROR_LOG_KEY);
}

export function downloadErrorLog() {
  const errors = getErrorLog();
  const blob = new Blob([JSON.stringify(errors, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fox-valley-errors-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
