#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';

/*
Baseline coverage utility.
Modes:
  generate: writes .coverage-baseline.json using combined-coverage.json (expects combinedPct & combinedBranchesPct)
  compare: compares current combined-coverage.json to baseline; prints JSON result and exits non-zero if drop exceeds thresholds.
Env vars:
  MAX_STATEMENT_DROP (default 1)  -> allowed statements pct drop
  MAX_BRANCH_DROP (default 1.5)   -> allowed branches pct drop
*/

const mode = process.argv[2] || 'compare';
const baselinePath = '.coverage-baseline.json';

function loadJSON(path){ if(existsSync(path)) return JSON.parse(readFileSync(path,'utf8')); return null; }

function saveBaseline(){
  const current = loadJSON('combined-coverage.json');
  if(!current){ console.error('combined-coverage.json missing; cannot generate baseline'); process.exit(1); }
  const data = {
    generatedAt: new Date().toISOString(),
    statements: current.combinedPct ?? 0,
    branches: current.combinedBranchesPct ?? 0
  };
  writeFileSync(baselinePath, JSON.stringify(data,null,2));
  console.log('Baseline written:', data);
}

function compare(){
  const base = loadJSON(baselinePath);
  if(!base){ console.warn('No baseline found; treat as pass'); return; }
  const current = loadJSON('combined-coverage.json') || { combinedPct:0, combinedBranchesPct:0 };
  const stmtDrop = (base.statements - (current.combinedPct||0));
  const brDrop = (base.branches - (current.combinedBranchesPct||0));
  const maxStmt = parseFloat(process.env.MAX_STATEMENT_DROP || '1');
  const maxBr = parseFloat(process.env.MAX_BRANCH_DROP || '1.5');
  const result = { baseline: base, current: { statements: current.combinedPct, branches: current.combinedBranchesPct }, drops: { statements: stmtDrop, branches: brDrop }, thresholds: { statements: maxStmt, branches: maxBr } };
  console.log('Coverage baseline comparison:', JSON.stringify(result));
  if(stmtDrop > maxStmt || brDrop > maxBr){
    console.error('Coverage drop exceeds threshold(s).');
    process.exit(2);
  }
}

if(mode === 'generate') saveBaseline(); else compare();
