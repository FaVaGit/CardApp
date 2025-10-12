#!/usr/bin/env node
/* eslint-env node */
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
function extract(summary){
  try {
    const s = summary.total.statements || {};
    const b = summary.total.branches || {};
    return { 
      statements: { pct: s.pct ?? 0, covered: s.covered ?? 0, total: s.total ?? 0 },
      branches: { pct: b.pct ?? 0, covered: b.covered ?? 0, total: b.total ?? 0 }
    };
  } catch { return { statements:{ pct:0, covered:0, total:0 }, branches:{ pct:0, covered:0, total:0 } }; }
}
const unit = readUnit();
const backend = readBackend();
const u = unit ? extract(unit) : { statements:{pct:0,covered:0,total:0}, branches:{pct:0,covered:0,total:0} };
const b = backend ? extract(backend) : { statements:{pct:0,covered:0,total:0}, branches:{pct:0,covered:0,total:0} };

function weighted(a, c){
  // a and c: {covered,total,pct}
  if( (a.total||0) > 0 || (c.total||0) > 0 ){
    const covered = (a.covered|| (a.pct? Math.round(a.pct/100*(a.total||0)):0)) + (c.covered|| (c.pct? Math.round(c.pct/100*(c.total||0)):0));
    const total = (a.total|| (a.pct? Math.round(a.pct/100*(a.covered||0)):0)) + (c.total|| (c.pct? Math.round(c.pct/100*(c.covered||0)):0));
    return total? (covered/total*100):0;
  }
  const parts=[]; if(a.pct) parts.push(a.pct); if(c.pct) parts.push(c.pct); return parts.length? parts.reduce((x,y)=>x+y,0)/parts.length:0;
}

let finalPct = weighted(u.statements, b.statements);
let finalBranchesPct = weighted(u.branches, b.branches);
if(isNaN(finalPct)) finalPct=0; if(isNaN(finalBranchesPct)) finalBranchesPct=0;
function format(p){return `${p.toFixed(1)}%`;}

if(!existsSync('README.md')) { console.error('README.md missing'); process.exit(0); }
let md = readFileSync('README.md','utf8');
const stmtBadgeRegex = /!\[Coverage\]\([^)]*\)/;
const branchBadgeRegex = /!\[Branches\]\([^)]*\)/;
const newStmtBadge = `![Coverage](https://img.shields.io/badge/coverage-${encodeURIComponent(format(finalPct))}-blue?style=flat)`;
const newBranchBadge = `![Branches](https://img.shields.io/badge/branches-${encodeURIComponent(format(finalBranchesPct))}-purple?style=flat)`;
if(stmtBadgeRegex.test(md)) md = md.replace(stmtBadgeRegex, newStmtBadge); else console.warn('Statements coverage badge not found');
if(branchBadgeRegex.test(md)) md = md.replace(branchBadgeRegex, newBranchBadge); else {
  // Append branch badge next to coverage badge if missing
  if(stmtBadgeRegex.test(md)) md = md.replace(newStmtBadge, `${newStmtBadge} ${newBranchBadge}`);
}
writeFileSync('README.md', md, 'utf8');
console.log('Updated combined coverage badges -> statements', format(finalPct), 'branches', format(finalBranchesPct));
// Emit machine readable summary (include branches)
try { writeFileSync('combined-coverage.json', JSON.stringify({ combinedPct: finalPct, combinedBranchesPct: finalBranchesPct }, null, 2)); } catch { /* ignore */ }
