#!/usr/bin/env node
/* eslint-env node */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';

// Simple Cobertura XML parser (no external deps) extracting line-rate or statements by class
// Fallback: if no XML found, produce 0% summary.

function parseAttributes(tag) {
  const attrs = {};
  const regex = /(\w+)="([^"]*)"/g;
  let m; while((m = regex.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
}

function summarize(xml){
  // Root <coverage> can have: lines-valid, lines-covered, line-rate, branches-covered, branches-valid, branch-rate
  const rootMatch = xml.match(/<coverage[^>]*>/);
  let linePct=0,lineCovered=0,lineTotal=0,branchPct=0,branchCovered=0,branchTotal=0;
  if(rootMatch){
    const attrs = parseAttributes(rootMatch[0]);
    if(attrs['lines-valid'] && attrs['lines-covered']){
      lineTotal = parseInt(attrs['lines-valid'],10)||0;
      lineCovered = parseInt(attrs['lines-covered'],10)||0;
      linePct = lineTotal? (lineCovered/lineTotal*100):0;
    } else if(attrs['line-rate']) {
      linePct = parseFloat(attrs['line-rate'])*100 || 0;
    }
    if(attrs['branches-covered'] && attrs['branches-valid']){
      branchTotal = parseInt(attrs['branches-valid'],10)||0;
      branchCovered = parseInt(attrs['branches-covered'],10)||0;
      branchPct = branchTotal? (branchCovered/branchTotal*100):0;
    } else if(attrs['branch-rate']) {
      branchPct = parseFloat(attrs['branch-rate'])*100 || 0;
    }
  }
  // If no root totals, fallback accumulating class nodes for lines
  if(lineTotal === 0){
    let covered=0,total=0; let any=false;
    const classRegex=/<class [^>]*line-rate="([0-9.]+)"[^>]*>/g; let c;
    while((c=classRegex.exec(xml))){ any=true; const rate=parseFloat(c[1]); total+=1; covered+=rate; }
    if(any){
      linePct = total? (covered/total*100):0;
    }
  }
  return {
    total: {
      statements: { pct: linePct, covered: lineCovered, total: lineTotal },
      branches: { pct: branchPct, covered: branchCovered, total: branchTotal }
    }
  };
}

function run(){
  const path = process.argv[2] || 'Backend/ComplicityGame.Tests/TestResults';
  // Find first cobertura xml
  if(!existsSync(path)){
    writeFileSync('backend-coverage-summary.json', JSON.stringify({ total:{ statements:{ pct:0, covered:0, total:0 } } },null,2));
    console.log('No backend coverage path found, wrote zero summary');
    return;
  }
  // naive scan for cobertura files
  let file = null;
  const stack=[path];
  while(stack.length){
    const dir=stack.pop();
    for(const f of readdirSync(dir)){
      const full = dir + '/' + f;
      const st = statSync(full);
      if(st.isDirectory()) stack.push(full); else if(/cobertura\.(xml)$/i.test(f)) { file=full; break; }
    }
    if(file) break;
  }
  if(!file){
    writeFileSync('backend-coverage-summary.json', JSON.stringify({ total:{ statements:{ pct:0, covered:0, total:0 } } },null,2));
    console.log('No cobertura file found, wrote zero summary');
    return;
  }
  const xml = readFileSync(file,'utf8');
  const summary = summarize(xml);
  writeFileSync('backend-coverage-summary.json', JSON.stringify(summary,null,2));
  console.log('Backend coverage summary written from', file, 'pct=', summary.total.statements.pct.toFixed(2));
}
run();
