#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';

function readUnit() {
  const p = 'unit-coverage/coverage-summary.json';
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  return null;
}
function readBackend() {
  // Backend placeholder summary
  const p = 'backend-coverage/backend-coverage-summary.json';
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  return null;
}
function extractPct(summary) {
  try { return summary.total.statements.pct; } catch { return 0; }
}
const unit = readUnit();
const backend = readBackend();
const unitPct = unit ? extractPct(unit) : 0;
const backendPct = backend ? extractPct(backend) : 0;
// Weighted average currently trivial because backend coverage not instrumented: just unitPct
const combined = (unitPct + backendPct) / ( (backend && unit) ? 2 : 1 );
const finalPct = isNaN(combined) ? 0 : combined;
function format(p){return `${p.toFixed(1)}%`;}

if(!existsSync('README.md')) { console.error('README.md missing'); process.exit(0); }
const md = readFileSync('README.md','utf8');
const badgeRegex = /!\[Coverage\]\([^\)]*\)/;
const newBadge = `![Coverage](https://img.shields.io/badge/coverage-${encodeURIComponent(format(finalPct))}-blue?style=flat)`;
if(!badgeRegex.test(md)) { console.warn('Coverage badge not found in README'); process.exit(0); }
const updated = md.replace(badgeRegex, newBadge);
writeFileSync('README.md', updated, 'utf8');
console.log('Updated combined coverage badge ->', format(finalPct));
