#!/usr/bin/env node
// Aggregates backend Cobertura + frontend lcov to a simple JSON summary.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function readCobertura() {
  const matches = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/coverage\.cobertura\.xml$/i.test(f)) matches.push(full);
    }
  }
  walk(root);
  if (!matches.length) return null;
  const file = matches[0];
  const xml = fs.readFileSync(file, 'utf-8');
  const json = await parseStringPromise(xml);
  const metrics = json.coverage?.$;
  if (!metrics) return null;
  return {
    lineRate: Number(metrics['line-rate']) || 0,
    branchRate: Number(metrics['branch-rate']) || 0,
    linesCovered: Number(metrics['lines-covered']) || 0,
    linesValid: Number(metrics['lines-valid']) || 0
  };
}

function readFrontendLcov() {
  const lcovPath = path.join(root, 'coverage', 'lcov.info');
  if (!fs.existsSync(lcovPath)) return null;
  const content = fs.readFileSync(lcovPath, 'utf-8');
  // Simple parse: count DA: lines covered vs total
  let total = 0, covered = 0;
  for (const line of content.split('\n')) {
    if (line.startsWith('DA:')) {
      const parts = line.substring(3).split(',');
      if (parts.length === 2) {
        total++;
        if (Number(parts[1]) > 0) covered++;
      }
    }
  }
  return { linesCovered: covered, linesValid: total, lineRate: total ? covered / total : 0 };
}

(async () => {
  const backend = await readCobertura();
  const frontend = readFrontendLcov();
  const summary = { backend, frontend };
  if (backend && frontend) {
    const totalCovered = backend.linesCovered + frontend.linesCovered;
    const totalValid = backend.linesValid + frontend.linesValid;
    summary.combined = {
      linesCovered: totalCovered,
      linesValid: totalValid,
      lineRate: totalValid ? totalCovered / totalValid : 0
    };
  }
  const outPath = path.join(root, 'coverage-summary.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log('Coverage summary written to', outPath);
})();
