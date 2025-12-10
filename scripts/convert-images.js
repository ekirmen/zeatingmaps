// scripts/convert-images.js
// Small utility to convert images (png/jpg) to WebP and AVIF using sharp.
// Usage: node scripts/convert-images.js [--src public/assets --out public/assets/optimized --formats webp,avif]

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Minimal argv parsing (no external deps)
const rawArgs = process.argv.slice(2);
const argv = {};
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = rawArgs[i+1];
    if (next && !next.startsWith('--')) { argv[key] = next; i++; }
    else { argv[key] = true; }
  }
}

const srcDir = path.resolve(process.cwd(), argv.src || 'public/assets');
const outDir = path.resolve(process.cwd(), argv.out || path.join(srcDir, 'optimized'));
const formats = (argv.formats || 'webp,avif').split(',').map(s => s.trim().toLowerCase());
const quality = argv.quality ? parseInt(argv.quality, 10) : 75;

if (!fs.existsSync(srcDir)) {
  console.error('Source directory does not exist:', srcDir);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

function isImage(file) {
  return /\.(png|jpe?g|webp|avif)$/i.test(file);
}

async function convert(filePath) {
  const rel = path.relative(srcDir, filePath);
  const parsed = path.parse(rel);
  const buffer = fs.readFileSync(filePath);

  for (const fmt of formats) {
    const outPath = path.join(outDir, parsed.dir, parsed.name + '.' + fmt);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    let pipeline = sharp(buffer).rotate();
    if (fmt === 'webp') pipeline = pipeline.webp({ quality });
    else if (fmt === 'avif') pipeline = pipeline.avif({ quality });
    else continue;

    try {
      await pipeline.toFile(outPath);
      console.log('Written:', outPath);
    } catch (err) {
      console.error('Failed to convert', filePath, '->', fmt, err.message);
    }
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && isImage(ent.name)) convert(full).catch(err => console.error(err));
  }
}

console.log('Converting images from', srcDir, 'to', outDir, 'formats:', formats.join(','));
walk(srcDir);
