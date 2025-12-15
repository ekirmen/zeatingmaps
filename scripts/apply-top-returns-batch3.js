/*
Apply conservative wraps to candidates whose first return is within the first LINE_THRESHOLD lines.
This batch uses LINE_THRESHOLD = 12.
*/
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const LINE_THRESHOLD = 12;

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file === 'node_modules' || file === 'build' || file === '.git') continue;
      results.push(...walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(full);
    }
  }
  return results;
}

function isImportLine(line) {
  return /^\s*(import\s.+from\s.+|import\s+['"]).*/.test(line) || /^\s*const\s+\w+\s*=\s*require\(/.test(line);
}

function wrapContent(content) {
  const lines = content.split(/\r?\n/);
  let i = 0;
  const imports = [];
  while (i < lines.length && (isImportLine(lines[i]) || /^\s*\/\//.test(lines[i]) || /^\s*\/\*/.test(lines[i]) || /^\s*\*/.test(lines[i]) || /^\s*$/.test(lines[i]) )) {
    imports.push(lines[i]);
    i++;
  }
  const body = lines.slice(i).join('\n');
  const compName = 'AutoWrapped_' + Math.random().toString(36).slice(2, 8);
  const wrapped = [];
  if (imports.length) wrapped.push(imports.join('\n'));
  else wrapped.push("import React from 'react';");
  wrapped.push('');
  wrapped.push(`const ${compName} = (props) => {`);
  const bodyLines = body.split(/\r?\n/).map(l => l ? '  ' + l : l);
  wrapped.push(...bodyLines);
  wrapped.push('};');
  wrapped.push('');
  wrapped.push(`export default ${compName};`);
  return wrapped.join('\n');
}

function main() {
  console.log('Scanning and applying to files with top-return <=', LINE_THRESHOLD);
  const files = walk(srcDir);
  const candidates = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split(/\r?\n/).slice(0, LINE_THRESHOLD);
      for (let idx = 0; idx < lines.length; idx++) {
        const l = lines[idx].trim();
        if (/^return\b/.test(l) || /^return\s*<|^return\s*\(/.test(l) || /^</.test(l)) {
          if (/\bexport\s+default\b/.test(content) || /module\.exports\s*=/.test(content)) break;
          candidates.push({file: f, line: idx+1, snippet: l});
          break;
        }
      }
    } catch (e) {}
  }
  console.log('Will patch', candidates.length, 'files:');
  for (const c of candidates) console.log('-', path.relative(root, c.file), `(line ${c.line}): ${c.snippet}`);

  if (!candidates.length) return;
  console.log('\nApplying patches (backups .bak)...');
  for (const c of candidates) {
    try {
      const content = fs.readFileSync(c.file, 'utf8');
      fs.writeFileSync(c.file + '.bak', content, 'utf8');
      const wrapped = wrapContent(content);
      fs.writeFileSync(c.file, wrapped, 'utf8');
      console.log('Patched', path.relative(root, c.file));
    } catch (e) {
      console.error('Failed', c.file, e.message);
    }
  }
  console.log('\nDone.');
}

main();
