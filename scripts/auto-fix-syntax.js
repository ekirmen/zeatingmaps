/*
Simple automatic fixer for recurring parse errors.
WARNING: This script performs regex-based edits — review commits.
Usage:
  node scripts/auto-fix-syntax.js        # dry-run (list candidates)
  node scripts/auto-fix-syntax.js --apply  # apply changes (will backup with .bak)

What it tries to fix (safe automated patterns):
- Files where the first non-import code starts with `return <` or `return (` -> wrap the non-import body into a React functional component and export it.

It preserves top import lines. For safety, it will not touch files that already contain `export default` or `module.exports`.
*/

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

const APPLY = process.argv.includes('--apply');

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

function shouldWrap(content) {
  // Skip if already has export default or module.exports
  if (/\bexport\s+default\b/.test(content) || /module\.exports\s*=/.test(content)) return false;

  const lines = content.split(/\r?\n/);
  let i = 0;
  // skip shebang
  if (lines[i] && lines[i].startsWith('#!')) i++;
  // skip imports
  while (i < lines.length && (isImportLine(lines[i]) || /^\s*\/\//.test(lines[i]) || /^\s*\/\*/.test(lines[i]) || /^\s*\*/.test(lines[i]) || /^\s*$/.test(lines[i]) )) {
    i++;
  }
  if (i >= lines.length) return false;
  const next = lines.slice(i).join('\n').trimLeft();
  // If the remaining text starts with `return <` or `return (` then it's a candidate
  if (/^return\s*<|^return\s*\(/.test(next)) return true;
  return false;
}

function wrapContent(content, originalPath) {
  const lines = content.split(/\r?\n/);
  let i = 0;
  // collect imports/require lines
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
  // indent body lines by two spaces
  const bodyLines = body.split(/\r?\n/).map(l => l ? '  ' + l : l);
  wrapped.push(...bodyLines);
  wrapped.push('};');
  wrapped.push('');
  wrapped.push(`export default ${compName};`);

  return wrapped.join('\n');
}

function main() {
  console.log('Scanning for candidate files under', srcDir);
  const files = walk(srcDir);
  const candidates = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      if (shouldWrap(content)) candidates.push(f);
    } catch (e) {
      // ignore
    }
  }
  console.log('\nFound', candidates.length, 'candidate files.');
  if (!candidates.length) return;
  for (const f of candidates) {
    console.log('-', path.relative(root, f));
  }

  if (!APPLY) {
    console.log('\nDry-run (no files changed). Rerun with --apply to modify files.');
    return;
  }

  console.log('\nApplying changes...');
  for (const f of candidates) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const backup = f + '.bak';
      fs.writeFileSync(backup, content, 'utf8');
      const wrapped = wrapContent(content, f);
      fs.writeFileSync(f, wrapped, 'utf8');
      console.log('Patched', path.relative(root, f));
    } catch (e) {
      console.error('Failed', f, e.message);
    }
  }
  console.log('\nDone. Please run `git add -A && git commit -m "fix: auto-wrap top-level returns (batch)"` to commit changes.');
}

main();
