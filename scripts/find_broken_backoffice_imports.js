const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const BACKOFFICE = path.join(SRC, 'backoffice');

const exts = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, filelist);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(full)) {
      filelist.push(full);
    }
  }
  return filelist;
}

function resolveImport(fromFile, importPath) {
  if (!importPath.startsWith('.')) return null; // ignore external packages
  const fromDir = path.dirname(fromFile);
  const candidate = path.resolve(fromDir, importPath);
  for (const e of exts) {
    const p = path.extname(e).length ? candidate + e : candidate + e; // keep same
    if (fs.existsSync(p)) return p;
  }
  // also check exact file without extension
  if (fs.existsSync(candidate)) return candidate;
  return null;
}

function main() {
  const files = walk(BACKOFFICE);
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const issues = [];

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const importPath = m[1];
      if (!importPath.startsWith('.')) continue;
      const resolved = resolveImport(f, importPath);
      if (!resolved) {
        // check if import path includes '/hooks/', '/services/' or '/components/' — those are likely intended to point to top-level or backoffice
        if (importPath.includes('/hooks/') || importPath.includes('/services/') || importPath.includes('/components/')) {
          issues.push({ file: f, import: importPath });
        }
      }
    }
  }

  if (!issues.length) {
    console.log('No broken backoffice imports detected.');
    process.exit(0);
  }

  console.log('Potentially broken backoffice imports:');
  for (const it of issues) {
    console.log(`- ${path.relative(process.cwd(), it.file)} -> ${it.import}`);
  }
  process.exit(2);
}

main();
