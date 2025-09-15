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
function extract(summary){
  try {
    const s = summary.total.statements;
    return { pct: s.pct ?? 0, covered: s.covered ?? 0, total: s.total ?? 0 };
  } catch { return { pct:0, covered:0, total:0 }; }
}
const unit = readUnit();
const backend = readBackend();
const u = unit ? extract(unit) : {pct:0,covered:0,total:0};
const b = backend ? extract(backend) : {pct:0,covered:0,total:0};
let finalPct = 0;
if( (u.total||0) > 0 || (b.total||0) > 0 ){
  const covered = (u.covered||Math.round(u.pct/100*(u.total||0))) + (b.covered||Math.round(b.pct/100*(b.total||0)));
  const total = (u.total|| (u.pct? Math.round(u.pct/100*(u.covered||0)):0)) + (b.total|| (b.pct? Math.round(b.pct/100*(b.covered||0)):0));
  finalPct = total? (covered/total*100):0;
} else {
  // fallback average if only pct values exist without totals
  const parts = [];
  if(u.pct) parts.push(u.pct);
  if(b.pct) parts.push(b.pct);
  finalPct = parts.length? parts.reduce((a,c)=>a+c,0)/parts.length : 0;
}
if(isNaN(finalPct)) finalPct=0;
function format(p){return `${p.toFixed(1)}%`;}

if(!existsSync('README.md')) { console.error('README.md missing'); process.exit(0); }
const md = readFileSync('README.md','utf8');
const badgeRegex = /!\[Coverage\]\([^\)]*\)/;
const newBadge = `![Coverage](https://img.shields.io/badge/coverage-${encodeURIComponent(format(finalPct))}-blue?style=flat)`;
if(!badgeRegex.test(md)) { console.warn('Coverage badge not found in README'); process.exit(0); }
const updated = md.replace(badgeRegex, newBadge);
writeFileSync('README.md', updated, 'utf8');
console.log('Updated combined coverage badge ->', format(finalPct));
