#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';

function load(path){ if(existsSync(path)) return JSON.parse(readFileSync(path,'utf8')); return null; }
const unit = load('unit-coverage/coverage-summary.json');
const backend = load('backend-coverage/backend-coverage-summary.json');
const combined = load('combined-coverage.json');

function pct(v){ return v==null? '0%': (typeof v==='number'? v.toFixed(1)+'%': (v.pct!=null? v.pct.toFixed(1)+'%':'0%')); }
function extract(summary){ try { return summary.total.statements.pct; } catch { return 0; } }

const unitPct = unit? extract(unit):0;
const backendPct = backend? extract(backend):0;
const combinedPct = combined? combined.combinedPct: ((unitPct+backendPct)/( (unit && backend)?2:1));

const body = `### Coverage Summary\n\n| Scope | Statements |\n|-------|------------|\n| Frontend (unit) | ${pct(unitPct)} |\n| Backend | ${pct(backendPct)} |\n| Combined | ${pct(combinedPct)} |\n\n_This comment is auto-generated._`;

process.stdout.write(body);
