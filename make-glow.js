/**
 * Hornea un GLOW (halo azul + blanco difuminado) detrás de cada teléfono / card,
 * directamente en el PNG. Esto sobrevive en Gmail (que borra box-shadow/gradients).
 *
 * Lee los PNG ya recortados y los sobrescribe agregando padding transparente
 * con el resplandor. CORRER UNA SOLA VEZ (si se corre de nuevo, vuelve a padear).
 *
 * USO: node make-glow.js
 */
const sharp = require('sharp');
const path = require('path');
const P = (f) => path.join(__dirname, f);

const PAD = 60;

async function glow(file) {
  const meta = await sharp(P(file)).metadata();
  const w = meta.width, h = meta.height;
  const W = w + PAD * 2, H = h + PAD * 2;

  // silueta a partir del canal alpha
  const alpha = await sharp(P(file)).ensureAlpha().extractChannel(3).png().toBuffer();

  const silhouette = (color) =>
    sharp({ create: { width: w, height: h, channels: 3, background: color } })
      .joinChannel(alpha).png().toBuffer();

  const padded = async (color) => {
    const sil = await silhouette(color);
    return sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: sil, top: PAD, left: PAD }])
      .png().toBuffer();
  };

  const blueGlow = await sharp(await padded('#4C9BD5')).blur(26).png().toBuffer();
  const whiteGlow = await sharp(await padded('#dfefff')).blur(11).png().toBuffer();
  const phone = await sharp(P(file)).toBuffer();

  const out = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: blueGlow, top: 0, left: 0 },
      { input: blueGlow, top: 0, left: 0 },
      { input: whiteGlow, top: 0, left: 0 },
      { input: phone, top: PAD, left: PAD },
    ])
    .png().toBuffer();

  await sharp(out).toFile(P(file));
  console.log('glow', file, '->', W + 'x' + H);
}

async function main() {
  await glow('img/phones/federada-phone.png');
  await glow('img/phones/espanol-phones.png');
  await glow('img/out/gamma-card.png');
}

main().catch((e) => { console.error(e); process.exit(1); });
