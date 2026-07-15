/**
 * Minimal, dependency-free logger for the mail module.
 * The base project has no logger of its own (just console.log/warn/error scattered
 * around), so this gives the mail module consistent, prefixed, timestamped output
 * without introducing a new dependency like winston/pino for a single module.
 */

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (...args) => console.log(`[MAIL] [${timestamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[MAIL] [${timestamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[MAIL] [${timestamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.MAIL_DEBUG === 'true') {
      console.log(`[MAIL] [${timestamp()}] [DEBUG]`, ...args);
    }
  },
};

module.exports = logger;
