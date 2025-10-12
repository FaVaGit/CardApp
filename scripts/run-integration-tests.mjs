#!/usr/bin/env node
/* eslint-env node */
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const BACKEND_READY_REGEX = /Backend ready on port 5000/;

function run(cmd, args, opts={}) {
  return spawn(cmd, args, { stdio: 'pipe', ...opts });
}

async function waitForBackend(proc, timeoutMs=20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let buffer = '';
    proc.stdout.on('data', d => {
      buffer += d.toString();
      if (BACKEND_READY_REGEX.test(buffer)) {
        resolve();
      }
    });
    proc.stderr.on('data', d => {
      buffer += d.toString();
    });
    const check = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        reject(new Error('Timeout waiting backend readiness'));
      }
    }, 500);
  });
}

async function main() {
  console.log('▶ Avvio backend per test integrazione...');
  const backend = run('bash', ['start.sh']);
  backend.stdout.pipe(process.stdout);
  backend.stderr.pipe(process.stderr);
  try {
    await waitForBackend(backend);
    console.log('✅ Backend pronto, avvio test vitest integrazione...');
    // Attendi un filo in più per sicurezza
    await delay(1000);
  // Esegui tutti i test di integrazione. Vitest userà il pattern definito in vitest.config.js
  // Specifico comunque la cartella per limitare la discovery ed evitare di rieseguire unit tests.
  const vitest = run('npx', ['vitest', 'run', 'tests/integration']);
    vitest.stdout.pipe(process.stdout);
    vitest.stderr.pipe(process.stderr);
    const exitCode = await new Promise(res => vitest.on('close', res));
    if (exitCode !== 0) {
      console.error('❌ Test integrazione falliti');
      backend.kill('SIGINT');
      process.exit(exitCode);
    }
    console.log('🎉 Test integrazione completati con successo');
  } catch (e) {
    console.error('❌ Errore durante esecuzione test:', e.message);
    backend.kill('SIGINT');
    process.exit(1);
  } finally {
  try { backend.kill('SIGINT'); } catch { /* ignore */ }
  }
}

main();
