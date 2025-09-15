#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

// Attempts to obtain overall statements coverage percentage.
// 1. Prefer coverage/coverage-summary.json (if produced by json-summary reporter)
// 2. Fallback: parse coverage/lcov.info aggregate 'end_of_record' sections
// 3. Fallback: scrape from generated HTML index (last resort) -> coverage/lcov-report/index.html

async function getCoveragePct() {
  // Try json summary
  const jsonPath = 'coverage/coverage-summary.json';
  if (existsSync(jsonPath)) {
    try {
      const summary = JSON.parse(readFileSync(jsonPath, 'utf8')); 
      const pct = summary?.total?.statements?.pct;
      if (typeof pct === 'number') return pct;
    } catch {}
  }

  // Try lcov.info aggregate (sum all SF records)
  const lcovPath = 'coverage/lcov.info';
  if (existsSync(lcovPath)) {
    try {
      const txt = readFileSync(lcovPath, 'utf8');
      const lines = txt.split(/\n/);
      let found = 0, covered = 0;
      for (const line of lines) {
        if (line.startsWith('DA:')) {
          // DA:<line>,<count>
          const parts = line.substring(3).split(',');
            if (parts.length === 2) {
              found++;
              const c = Number(parts[1]);
              if (!isNaN(c) && c > 0) covered++; // treat any executed at least once as covered
            }
        }
      }
      if (found > 0) {
        return (covered / found) * 100;
      }
    } catch {}
  }

  // Try scrape HTML summary table (index.html) for 'All files' row
  const htmlIndex = 'coverage/lcov-report/index.html';
  if (existsSync(htmlIndex)) {
    try {
      const html = readFileSync(htmlIndex, 'utf8');
      const match = html.match(/All files[^%]*?(\d+\.\d+|\d+)<\/span>%/); // first numeric percent
      if (match) return Number(match[1]);
    } catch {}
  }
  return 0;
}

function formatPct(p) {
  if (p == null || isNaN(p)) return '0%';
  return `${p.toFixed(1)}%`;
}

function updateReadme(pct) {
  const file = 'README.md';
  const md = readFileSync(file, 'utf8');
  // Replace existing badge line for Coverage (search for ![Coverage](...)
  const badgeRegex = /!\[Coverage\]\([^\)]*\)/;
  const newBadge = `![Coverage](https://img.shields.io/badge/coverage-${encodeURIComponent(pct)}-blue?style=flat)`;
  if (!badgeRegex.test(md)) {
    console.warn('Coverage badge placeholder not found, skipping');
    return;
  }
  const updated = md.replace(badgeRegex, newBadge);
  writeFileSync(file, updated, 'utf8');
  console.log('Updated coverage badge ->', pct);
}

// Main
(async () => {
  const pctNum = await getCoveragePct();
  updateReadme(formatPct(pctNum));
})();
