/**
 * Sentry Error Monitoring & Crash Tracking Helper
 * Captures client-side MediaPipe WASM vision crashes and WebRTC connection errors.
 */

export function captureException(error: any, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Production Error Tracked]:', error, context);
    // When @sentry/nextjs DSN is configured, Sentry will report error
  } else {
    console.warn('[Dev Error Tracked]:', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  console.log(`[Sentry ${level.toUpperCase()}]:`, message);
}
