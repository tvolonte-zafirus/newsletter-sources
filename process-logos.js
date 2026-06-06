const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG = path.join(__dirname, 'img');
const OUT = path.join(__dirname, 'img', 'out');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

async function renderSvg(file, outName, targetWidth, recolor) {
  let svg = fs.readFileSync(path.join(IMG, file), 'utf8');
  if (recolor) for (const [from, to] of recolor) svg = svg.split(from).join(to);
  await sharp(Buffer.from(svg), { density: 400 })
    .resize({ width: targetWidth })
    .png()
    .toFile(path.join(OUT, outName));
  console.log('rendered', outName);
}

// Tint a raster PNG to solid white using its alpha as mask
async function tintWhite(file, outName, targetWidth) {
  const src = sharp(path.join(IMG, file)).ensureAlpha();
  const { width, height } = await src.metadata();
  const alpha = await src.clone().extractChannel('alpha').toBuffer();
  const white = await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
  }).joinChannel(alpha).png().toBuffer();
  await sharp(white).resize({ width: targetWidth }).png().toFile(path.join(OUT, outName));
  console.log('tinted', outName);
}

(async () => {
  // Zafirus: white + blue accent, keep colors
  await renderSvg('zafirus.svg', 'zafirus.png', 600);
  // Federada: already white
  await renderSvg('federada.svg', 'federada.png', 520);
  // Gamma: recolor dark + green to white
  await renderSvg('gamma.svg', 'gamma.png', 520, [
    ['#1D1D1F', '#FFFFFF'],
    ['#2C6953', '#FFFFFF'],
  ]);
  // Hospital Español: raster, tint to white
  await tintWhite('hospital-espanol.png', 'hospital-espanol.png', 520);
  console.log('DONE');
})();
