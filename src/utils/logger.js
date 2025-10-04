/* Lightweight logger gated by DEBUG_API or development mode.
 * Usage:
 * import logger from '../utils/logger';
 * logger.debug('message', data);
 * logger.info('...'); logger.warn('...'); logger.error('...');
 */
const isBrowser = typeof window !== 'undefined';
const env = (import.meta && import.meta.env) ? import.meta.env : {};
const debugFlag = (isBrowser && window.DEBUG_API) || env.VITE_DEBUG_API || env.DEBUG_API || process?.env?.DEBUG_API;

function ts() { return new Date().toISOString(); }

function makeLogger(enabled) {
  const base = (level, args) => {
    // minimize overhead if disabled
    if (!enabled && level === 'debug') return;
    const prefix = `[Api][${level.toUpperCase()}][${ts()}]`;
    // eslint-disable-next-line no-console
    (console[level] || console.log)(prefix, ...args);
  };
  return {
    debug: (...a) => base('debug', a),
    info: (...a) => base('info', a),
    warn: (...a) => base('warn', a),
    error: (...a) => base('error', a)
  };
}

// Enable debug level only if flag present; info/warn/error always pass through.
const logger = makeLogger(!!debugFlag);
export default logger;