// lib/errorHandler.ts

export function handleError(error: Error, context: string) {
  console.error(`[Error Audit - ${context}]:`, error);

  // Dynamic import Sentry check to prevent package missing build failures
  try {
    const Sentry = require('@sentry/nextjs');
    if (Sentry && typeof Sentry.captureException === 'function') {
      Sentry.setContext('feature', { location: context });
      Sentry.captureException(error);
    }
  } catch (e) {
    // Sentry package not loaded in client env
  }
}
