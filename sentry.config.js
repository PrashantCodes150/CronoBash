// sentry.config.js
// Configured as a safe wrapper to prevent build crashes if Sentry is not installed

let Sentry = null;
try {
  Sentry = require('@sentry/nextjs');
} catch (e) {
  // Sentry not installed yet in package.json
}

if (Sentry) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2,
  });
}
