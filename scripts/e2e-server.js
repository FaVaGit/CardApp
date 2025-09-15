#!/usr/bin/env node
// Starts backend (dotnet) and frontend (vite) for Playwright tests, waits until ready.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import http from 'node:http';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const BACKEND_DIR = path.join(root, 'Backend/ComplicityGame.Api');
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;

let backendProc, frontendProc;

function waitFor(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, res => {
        if (res.statusCode && res.statusCode < 500) {
          return resolve();
        }
        res.resume();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for ' + url));
      setTimeout(attempt, 750);
    };
    attempt();
  });
}

async function start() {
  console.log('🔧 Avvio environment e2e...');
  let backendAlreadyUp = false;
  try {
    await waitFor(`http://localhost:${BACKEND_PORT}/swagger`, 3000);
    backendAlreadyUp = true;
    console.log('♻️  Backend già attivo, riuso processo esistente');
  } catch {
    // start new backend
    backendProc = spawn('dotnet', ['run', '--urls', `http://localhost:${BACKEND_PORT}`], {
      cwd: BACKEND_DIR,
      stdio: 'inherit'
    });
    backendProc.on('exit', code => {
      if (code !== 0) console.error('Backend exited with code', code);
    });
    await waitFor(`http://localhost:${BACKEND_PORT}/swagger`).catch(e => {
      console.error('Backend non pronto:', e.message); process.exit(1);
    });
    console.log('✅ Backend avviato');
  }

  frontendProc = spawn('npm', ['run', 'dev', '--', '--port', FRONTEND_PORT], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(FRONTEND_PORT) }
  });

  await waitFor(`http://localhost:${FRONTEND_PORT}`).catch(e => {
    console.error('Frontend non pronto:', e.message); process.exit(1);
  });
  console.log('✅ Frontend pronto');

  // Optional environment cleanup
  const wantClear = (process.env.CLEAR_USERS_ON_START ?? 'true').toLowerCase() === 'true';
  if (wantClear) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          method: 'POST',
          host: 'localhost',
          port: BACKEND_PORT,
          path: '/api/admin/clear-users'
        }, res => {
          if (res.statusCode && res.statusCode < 300) {
            console.log('🧹 clear-users eseguito');
            res.resume();
            resolve();
          } else {
            console.warn('⚠️ clear-users status', res.statusCode);
            res.resume();
            resolve(); // non-blocking
          }
        });
        req.on('error', err => {
          console.warn('⚠️ clear-users errore:', err.message);
          resolve(); // non-blocking
        });
        req.end();
      });
    } catch { /* ignore */ }
  } else {
    console.log('↩️  CLEAR_USERS_ON_START=false: skip pulizia utenti');
  }

  // Keep process alive until SIGINT from Playwright test runner stops it.
}

process.on('SIGINT', () => {
  console.log('\n🛑 Arresto e2e server...');
  for (const p of [frontendProc, backendProc]) {
    if (p && !p.killed) try { p.kill('SIGINT'); } catch { /* ignore */ }
  }
  process.exit(0);
});

start();
