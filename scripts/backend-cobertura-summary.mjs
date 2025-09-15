#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';

// Simple Cobertura XML parser (no external deps) extracting line-rate or statements by class
// Fallback: if no XML found, produce 0% summary.

function parseAttributes(tag) {
  const attrs = {};
  const regex = /(\w+)="([^"]*)"/g;
  let m; while((m = regex.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
}

function summarize(xml){
  // Try overall line-rate attribute on root <coverage>
  const rootMatch = xml.match(/<coverage[^>]*>/);
  if(rootMatch){
    const attrs = parseAttributes(rootMatch[0]);
    if(attrs['lines-valid'] && attrs['lines-covered']){
      const total = parseInt(attrs['lines-valid'],10)||0;
      const covered = parseInt(attrs['lines-covered'],10)||0;
      return { total: { statements: { pct: total? (covered/total*100):0, covered, total } } };
    }
    if(attrs['line-rate']){
      const pct = parseFloat(attrs['line-rate'])*100 || 0;
      return { total: { statements: { pct, covered: 0, total: 0 } } };
    }
  }
  // Fallback: sum from <class line-rate="...">
  let covered=0,total=0; let any=false;
  const classRegex=/<class [^>]*line-rate="([0-9.]+)"[^>]*>/g; let c;
  while((c=classRegex.exec(xml))){ any=true; const rate=parseFloat(c[1]); total+=1; covered+=rate; }
  if(any){
    const pct = total? (covered/total*100):0;
    return { total:{ statements:{ pct, covered:0, total:0 } } };
  }
  return { total:{ statements:{ pct:0, covered:0, total:0 } } };
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
  try {
    const { readdirSync, statSync } = require('fs');
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
  } catch {}
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
