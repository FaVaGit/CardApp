#!/usr/bin/env node
/* eslint-env node */
import { readFileSync, existsSync } from 'fs';

function load(path){ if(existsSync(path)) return JSON.parse(readFileSync(path,'utf8')); return null; }
const unit = load('unit-coverage/coverage-summary.json');
const backend = load('backend-coverage/backend-coverage-summary.json');
const combined = load('combined-coverage.json');
const baseline = load('.coverage-baseline.json');

function pct(v){ return v==null? '0%': (typeof v==='number'? v.toFixed(1)+'%': (v.pct!=null? v.pct.toFixed(1)+'%':'0%')); }
function extract(summary){
	try {
		return {
			stmts: summary.total.statements?.pct ?? 0,
			branches: summary.total.branches?.pct ?? 0
		};
	} catch { return { stmts:0, branches:0 }; }
}

const u = unit? extract(unit):{stmts:0,branches:0};
const b = backend? extract(backend):{stmts:0,branches:0};
const combinedPct = combined? combined.combinedPct: ((u.stmts + b.stmts)/( (unit && backend)?2:1));
const combinedBranchesPct = combined? combined.combinedBranchesPct : ((u.branches + b.branches)/( (unit && backend)?2:1));

function delta(current, base){ if(base==null) return ''; const d=(current-base); const sign=d>=0?'+':''; return `${sign}${d.toFixed(2)}%`; }
function decorateDrop(current, base){ if(base==null) return ''; const diff=current-base; if(diff < 0){ return ' ⚠️'; } return ''; }

function row(scope, data){ return `| ${scope} | ${pct(data.stmts)} | ${pct(data.branches)} |`; }

let baselineNote = '';
if(baseline){
	baselineNote = `\nBaseline statements: ${baseline.statements?.toFixed(2) ?? '0'}% | branches: ${baseline.branches?.toFixed(2) ?? '0'}%`;
}
const body = `### Coverage Summary\n\n| Scope | Statements | Branches |\n|-------|-----------:|----------:|\n${row('Frontend (unit)', u)}\n${row('Backend', b)}\n| Combined | ${pct(combinedPct)}${baseline? ` (${delta(combinedPct, baseline.statements)})${decorateDrop(combinedPct, baseline.statements)}`:''} | ${pct(combinedBranchesPct)}${baseline? ` (${delta(combinedBranchesPct, baseline.branches)})${decorateDrop(combinedBranchesPct, baseline.branches)}`:''} |\n${baselineNote}\n\n_This comment is auto-generated._`;

process.stdout.write(body);
