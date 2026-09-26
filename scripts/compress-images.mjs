// Shrink oversized images in place so the repository stays small.
//
// Usage:
//   node scripts/compress-images.mjs <file> [<file> ...]
//   node scripts/compress-images.mjs --all        # every image in src/assets/images
//
// Runs automatically in .github/workflows/compress-images.yml on images added
// or changed in a push (e.g. uploads from the admin panel). The site build
// already makes optimised copies for visitors; this only keeps the stored
// originals reasonable. Files keep their name and format, so content that
// references them does not change, and a file is only replaced if the result
// is smaller.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const MAX_EDGE = 2400; // px, longest side — plenty for full-width, high-DPI display
const MAX_BYTES = 1024 * 1024; // files under 1 MB and within MAX_EDGE are left alone
const ROOT = 'src/assets/images';
const EXT = /\.(jpe?g|png|webp)$/i;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });

const args = process.argv.slice(2);
const files = (args[0] === '--all' ? walk(ROOT) : args).filter((f) => EXT.test(f) && fs.existsSync(f));

const kb = (n) => `${Math.round(n / 1024)} KB`;
let saved = 0;

for (const file of files) {
  const before = fs.statSync(file).size;
  const meta = await sharp(file).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longest <= MAX_EDGE && before <= MAX_BYTES) continue;

  let img = sharp(file).rotate(); // bake in phone EXIF orientation
  if (longest > MAX_EDGE) img = img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside' });
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') img = img.png({ compressionLevel: 9, effort: 10 });
  else if (ext === '.webp') img = img.webp({ quality: 82 });
  else img = img.jpeg({ quality: 82, mozjpeg: true });

  const out = await img.toBuffer();
  if (out.length >= before) {
    console.log(`kept      ${file} (${kb(before)}, already efficient)`);
    continue;
  }
  fs.writeFileSync(file, out);
  saved += before - out.length;
  console.log(`compressed ${file}: ${kb(before)} -> ${kb(out.length)}`);
}

console.log(files.length ? `done, saved ${kb(saved)}` : 'no images to check');
