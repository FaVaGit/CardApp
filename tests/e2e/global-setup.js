// Global Playwright setup: opzionale clear-users una sola volta prima dell'esecuzione test.
// Usa CLEAR_USERS_ON_SETUP=false per disabilitare.
import http from 'node:http';

const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

async function callClearUsers() {
  return new Promise(resolve => {
    const req = http.request({
      method: 'POST',
      host: 'localhost',
      port: BACKEND_PORT,
      path: '/api/admin/clear-users'
    }, res => {
      res.resume();
      if (res.statusCode && res.statusCode < 300) {
        console.log('[global-setup] clear-users OK');
      } else {
        console.warn('[global-setup] clear-users status', res.statusCode);
      }
      resolve();
    });
    req.on('error', err => {
      console.warn('[global-setup] clear-users errore:', err.message);
      resolve();
    });
    req.end();
  });
}

/** @type {import('@playwright/test').FullConfig} */
export default async function globalSetup() {
  const enabled = (process.env.CLEAR_USERS_ON_SETUP ?? 'true').toLowerCase() === 'true';
  if (!enabled) {
    console.log('[global-setup] CLEAR_USERS_ON_SETUP=false: skip');
    return;
  }
  await callClearUsers();
}
