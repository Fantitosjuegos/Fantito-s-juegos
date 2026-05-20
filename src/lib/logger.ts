/**
 * logger.ts
 * ---------
 * A simple logger that is a no-op in production.
 * Use this instead of console.warn/error everywhere in the app.
 * In development: logs normally. In production: completely silent.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log:   isDev ? console.log.bind(console)   : () => {},
  warn:  isDev ? console.warn.bind(console)  : () => {},
  error: isDev ? console.error.bind(console) : () => {},
};