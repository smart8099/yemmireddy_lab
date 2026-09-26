// One-time import: copy the lab's source photos into src/assets/images with
// sensible names, upright orientation and web-friendly size.
//
// Usage:
//   python3 scripts/import-content/extract_docx_images.py "<zip folder>" <docimg dir>
//   node scripts/import-content/prepare_images.mjs <docimg dir> <converted Pictures dir>
//
// Where Pictures/ has the full-size original of a photo embedded in a Word
// doc (matched by perceptual hash), the original is used: Word stores
// heavily downscaled copies.
//
// Rotations come from the Word layout (a:xfrm rot="5400000"), which the image
// files themselves do not carry.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [docDir, picDir] = process.argv.slice(2);
const OUT = new URL('../../src/assets/images/', import.meta.url).pathname;
const MAX = 2000;

/** [source, destination, options] */
const jobs = [
  // Home carousel: prefer the high-resolution originals from Pictures/
  [`${picDir}/p-dsc_3958.jpg`, 'home/hero-team.jpg'],
  [`${docDir}/1-home-02.jpeg`, 'home/hero-lab-coats.jpg'],
  [`${picDir}/p-img_0354.jpg`, 'home/hero-field-sampling.jpg'],
  [`${picDir}/p-img_5291.jpg`, 'home/hero-lab-work.jpg'],
  [`${docDir}/1-home-05.png`, 'home/discovery-to-impact.png', { enhance: true }],

  // People (document order)
  [`${docDir}/2-people-01.png`, 'people/veerachandra-kranti-yemmireddy.jpg'],
  [`${docDir}/2-people-02.jpeg`, 'people/chandhini-muthukumar.jpg'],
  [`${docDir}/2-people-03.png`, 'people/marcos-aleman.jpg'],
  [`${docDir}/2-people-04.jpeg`, 'people/cephas-mensah-kisseh.jpg'],
  [`${docDir}/2-people-05.png`, 'people/addyson-cianciotto.jpg'],
  [`${docDir}/2-people-06.jpeg`, 'people/miguel-angel-mego.jpg'],
  [`${docDir}/2-people-07.jpeg`, 'people/fernanda-jimena-cisneros.jpg'],
  [`${docDir}/2-people-08.jpeg`, 'people/virginia-piccirillo.jpg', { rotate: 90 }],
  [`${docDir}/2-people-09.jpeg`, 'people/cesar-alejandro-paras.jpg', { extract: { left: 272, top: 370, width: 416, height: 520 } }],

  // Research
  [`${picDir}/p-img_0694.jpg`, 'research/understand-1.jpg'],
  [`${picDir}/p-img_0354.jpg`, 'research/understand-2.jpg'],
  [`${picDir}/p-img_5640.jpg`, 'research/understand-3.jpg'],
  [`${docDir}/3-research-05.jpeg`, 'research/understand-4.jpg', { rotate: 90 }],
  [`${docDir}/3-research-06.jpeg`, 'research/understand-5.jpg'],
  [`${docDir}/3-research-07.jpeg`, 'research/control-1.jpg', { rotate: 90 }],
  [`${docDir}/3-research-08.jpeg`, 'research/control-2.jpg', { rotate: 90 }],
  [`${picDir}/p-img_8739.jpg`, 'research/control-3.jpg'],
  [`${picDir}/p-img_6605.jpg`, 'research/control-4.jpg'],
  [`${picDir}/p-img_3489.jpg`, 'research/control-5.jpg'],
  [`${docDir}/3-research-12.jpeg`, 'research/control-6.jpg', { rotate: 90 }],
  // Original framework and QMRA-cycle graphics, shown under the HTML versions
  // (src/components/ResearchFramework.astro, DecisionCycle.astro).
  [`${docDir}/1-home-06.png`, 'research/insight-to-impact.png', { enhance: true }],
  [`${docDir}/3-research-13.png`, 'research/evidence-to-decision.png', { enhance: true }],
  [`${picDir}/p-img_3260.jpg`, 'research/inform-1.jpg'],

  // Teaching
  [`${picDir}/p-img_6463.jpg`, 'teaching/classroom-1.jpg'], // high-res original of the doc's lecture-hall photo
  [`${picDir}/p-picture-class-1.jpg`, 'teaching/classroom-2.jpg'],
  [`${docDir}/4-teaching-03.jpg`, 'teaching/classroom-3.jpg'],
  [`${picDir}/p-img_4260.jpg`, 'teaching/classroom-4.jpg'],
  [`${picDir}/p-20220630_yemmiredy_lab_high_scholar_ec_dp_006.jpg`, 'teaching/mentoring-1.jpg'],
  [`${picDir}/p-img_7102.jpg`, 'teaching/mentoring-2.jpg'],
  [`${picDir}/p-img_0361.jpg`, 'teaching/mentoring-3.jpg'],
  [`${docDir}/4-teaching-08.jpeg`, 'teaching/mentoring-4.jpg'],

  // Training & Outreach
  ...Array.from({ length: 17 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    const ext = [14, 16, 17].includes(i + 1) ? 'png' : 'jpeg';
    const dest = i + 1 === 14 ? 'outreach/education-empowerment-evaluation.png' : `outreach/outreach-${n}.jpg`;
    const original = { 1: 'p-img_2130.jpg', 16: 'p-picture4-ce2.png' }[i + 1];
    if (original) return [`${picDir}/${original}`, dest];
    return [`${docDir}/5-training-outreach-${n}.${ext}`, dest, i + 1 === 6 ? { rotate: 90 } : {}];
  }),
];

for (const [src, dest, opts = {}] of jobs) {
  const file = path.resolve(src);
  if (!fs.existsSync(file)) throw new Error(`Missing source ${file}`);
  const out = path.join(OUT, dest);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let img = sharp(file).rotate(); // apply EXIF orientation
  if (opts.rotate) img = sharp(await img.toBuffer()).rotate(opts.rotate);
  if (opts.extract) img = img.extract(opts.extract);
  if (opts.enhance) {
    // Infographics: upscale 2x with Lanczos and sharpen, so text stays crisp on
    // large/high-DPI screens instead of being stretched by the browser.
    const { width } = await sharp(file).metadata();
    img = img.resize({ width: Math.min(width * 2, 3200), kernel: 'lanczos3' }).sharpen({ sigma: 0.8, m1: 0.6, m2: 2.5 });
  } else {
    img = img.resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  }
  img = dest.endsWith('.png') ? img.png({ compressionLevel: 9 }) : img.flatten({ background: '#fff' }).jpeg({ quality: 82, mozjpeg: true });
  await img.toFile(out);
  console.log('wrote', dest);
}
