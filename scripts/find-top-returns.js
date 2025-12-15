/*
Find files where a `return` appears within the first N lines (conservative), list them, and optionally wrap them into a component.
Usage:
  node scripts/find-top-returns.js        # dry-run
  node scripts/find-top-returns.js --apply  # apply changes (creates .bak backups)
*/

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const APPLY = process.argv.includes('--apply');
const MAX_LINES = 60;

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
  // collect imports and leading comments/blank lines
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
  console.log('Scanning for top-return candidates under', srcDir);
  const files = walk(srcDir);
  const candidates = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split(/\r?\n/).slice(0, MAX_LINES);
      for (let idx = 0; idx < lines.length; idx++) {
        const l = lines[idx].trim();
        if (/^return\b/.test(l) || /^return\s*<|^return\s*\(/.test(l) || /^</.test(l)) {
          // check the line is not inside a function (best-effort): if there is 'function' or '=>' earlier in file before this line, skip
          const before = lines.slice(0, idx+1).join('\n');
          if (/function\s+\w+|=\s*\(|=>|class\s+\w+/.test(before)) {
            // likely inside a function — skip
            continue;
          }
          // also skip if file already has export default
          if (/\bexport\s+default\b/.test(content) || /module\.exports\s*=/.test(content)) continue;
          candidates.push({file: f, line: idx+1, snippet: l});
          break;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  console.log('\nFound', candidates.length, 'candidates.');
  for (const c of candidates) console.log('-', path.relative(root, c.file), `(line ${c.line}):`, c.snippet);

  if (!APPLY) {
    console.log('\nDry-run complete. Rerun with --apply to modify files.');
    return;
  }

  console.log('\nApplying conservative wraps (backups .bak)...');
  for (const c of candidates) {
    try {
      const content = fs.readFileSync(c.file, 'utf8');
      const backup = c.file + '.bak';
      fs.writeFileSync(backup, content, 'utf8');
      const wrapped = wrapContent(content);
      fs.writeFileSync(c.file, wrapped, 'utf8');
      console.log('Patched', path.relative(root, c.file));
    } catch (e) {
      console.error('Failed', c.file, e.message);
    }
  }
  console.log('\nDone. Commit changes when ready.');
}

main();
