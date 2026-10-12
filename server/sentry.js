import * as Sentry from "@sentry/node";

let enabled = false;

export function initSentry(extra = {}) {
  const dsn = extra.dsn || process.env.SENTRY_DSN;
  if (enabled || !dsn) return enabled;
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 1),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "production",
    sendDefaultPii: false, 
    ...extra,
  });
  enabled = true;
  return true;
}

export const sentryEnabled = () => enabled;

export async function flushSentry() {
  if (enabled) await Sentry.flush(2000).catch(() => {});
}

initSentry();
export { Sentry };
