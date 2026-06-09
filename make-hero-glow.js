/**
 * Genera img/out/hero-glow.png: glow radial azul sobre negro (estilo web Zafirus)
 * con el logo Zafirus centrado arriba. Se funde a negro puro abajo para
 * empalmar sin costura con el fondo negro del mail.
 *
 * USO: node make-hero-glow.js
 */
const sharp = require('sharp');
const path = require('path');

const W = 1240;   // 2x de 620 (retina)
const H = 520;

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="34%" r="66%">
      <stop offset="0%"  stop-color="#6FB2E6" stop-opacity="0.60"/>
      <stop offset="22%" stop-color="#4C9BD5" stop-opacity="0.40"/>
      <stop offset="45%" stop-color="#3983B8" stop-opacity="0.20"/>
      <stop offset="72%" stop-color="#13233B" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.0"/>
    </radialGradient>
    <linearGradient id="streak" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%"  stop-color="#7FC0F0" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="#4C9BD5" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="fadeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#000000"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <ellipse cx="${W / 2}" cy="0" rx="260" ry="320" fill="url(#streak)"/>
  <rect width="${W}" height="${H}" fill="url(#fadeBottom)"/>
</svg>`;

async function main() {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();

  const logo = await sharp(path.join(__dirname, 'img/out/zafirus.png'))
    .resize({ width: 300 })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  await sharp(base)
    .composite([{ input: logo, top: 110, left: Math.round((W - logoMeta.width) / 2) }])
    .png()
    .toFile(path.join(__dirname, 'img/out/hero-glow.png'));

  console.log('OK -> img/out/hero-glow.png');
}

main().catch((e) => { console.error(e); process.exit(1); });
