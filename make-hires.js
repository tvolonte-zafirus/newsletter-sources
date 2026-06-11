/**
 * Regenera TODAS las imágenes en ALTA resolución (para el rediseño grande):
 *  - Teléfonos: recorta los originales 1080x1350 y hornea el glow azul (v2),
 *    con PAD y blur escalados al tamaño real -> nítidos en grande.
 *  - Gamma: renderiza el mock SVG al doble de densidad (crisp).
 *
 * USO: node make-hires.js
 */
const sharp = require('sharp');
const path = require('path');
const P = (f) => path.join(__dirname, f);
const SRC = 'C:/Users/usuario/Documents/Newsletter Gmail Claude/';

// ---- glow horneado, parámetros proporcionales al ancho ----
async function bakeGlow(inputBuf, outFile) {
  const meta = await sharp(inputBuf).metadata();
  const w = meta.width, h = meta.height;
  const PAD = Math.round(w * 0.16);
  const blueBlur = Math.max(18, Math.round(w * 0.07));
  const whiteBlur = Math.max(8, Math.round(w * 0.03));
  const W = w + PAD * 2, H = h + PAD * 2;

  const alpha = await sharp(inputBuf).ensureAlpha().extractChannel(3).png().toBuffer();
  const sil = (color) =>
    sharp({ create: { width: w, height: h, channels: 3, background: color } })
      .joinChannel(alpha).png().toBuffer();
  const padded = async (color) =>
    sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await sil(color), top: PAD, left: PAD }]).png().toBuffer();

  const auraWide = await sharp(await padded('#4C9BD5')).blur(blueBlur).png().toBuffer();
  const auraMid = await sharp(await padded('#6FB2E6')).blur(whiteBlur).png().toBuffer();
  const subject = await sharp(inputBuf).png().toBuffer();

  // Aplanado sobre negro + JPEG: liviano y nítido. El fondo del mail es negro,
  // así que el glow se funde sin costura (no hace falta transparencia).
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: auraWide, top: 0, left: 0 },
      { input: auraWide, top: 0, left: 0 },
      { input: auraMid, top: 0, left: 0 },
      { input: subject, top: PAD, left: PAD },
    ])
    .flatten({ background: '#000000' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(P(outFile));
  console.log('glow', outFile, '->', W + 'x' + H);
}

// ---- Gamma mock (SVG) en alta ----
function gammaSvg() {
  const W = 640, H = 860;
  const heights = [18,34,52,30,64,40,74,46,88,58,96,62,80,44,70,36,58,28,42,20,
                   30,52,38,68,48,86,56,92,60,78,42,64,34,50,26,40,22,32,18,28];
  const bw = 9, gap = 6, x0 = 56, mid = 250;
  const bars = heights.map((hh, i) => {
    const x = x0 + i * (bw + gap);
    const col = i % 3 === 0 ? '#4C9BD5' : '#3983B8';
    return `<rect x="${x}" y="${mid - hh / 2}" width="${bw}" height="${hh}" rx="4" fill="${col}"/>`;
  }).join('');
  const field = (y, label, val, valColor) => `
    <text x="56" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" letter-spacing="2" fill="#3983B8">${label}</text>
    <text x="56" y="${y + 38}" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="bold" fill="${valColor}">${val}</text>
    <rect x="56" y="${y + 58}" width="528" height="1" fill="#23364f"/>`;
  return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#16294a"/><stop offset="100%" stop-color="#0f1d33"/>
  </linearGradient></defs>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="40" fill="url(#card)" stroke="#23364f" stroke-width="2"/>
  <rect x="56" y="56" width="220" height="48" rx="24" fill="#101D30"/>
  <circle cx="86" cy="80" r="9" fill="#4C9BD5"/>
  <text x="108" y="88" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" letter-spacing="2" fill="#E5E5E5">GRABANDO</text>
  <text x="${W - 56}" y="88" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#4C9BD5">00:42</text>
  ${bars}
  <text x="56" y="330" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" letter-spacing="3" fill="#4C9BD5">TRANSCRIBIENDO VOZ &#8594; CAMPOS CL&#205;NICOS</text>
  <rect x="56" y="352" width="528" height="2" fill="#23364f"/>
  ${field(430, 'MOTIVO DE CONSULTA', 'Control y dolor lumbar', '#FFFFFF')}
  ${field(540, 'DIAGN&#211;STICO', 'Lumbalgia mec&#225;nica', '#FFFFFF')}
  ${field(650, 'INDICACIONES', 'Reposo relativo + AINE', '#FFFFFF')}
  ${field(760, 'PR&#211;XIMO CONTROL', '15 d&#237;as', '#4C9BD5')}
</svg>`;
}

async function main() {
  const fed = await sharp(SRC + 'mock upssss.png').trim({ threshold: 10 }).png().toBuffer();
  await bakeGlow(fed, 'img/phones/federada-phone.jpg');

  const esp = await sharp(SRC + 'mock upssss (1).png').trim({ threshold: 10 }).png().toBuffer();
  await bakeGlow(esp, 'img/phones/espanol-phones.jpg');

  // gamma SVG renderizado a 2x (density 144) para nitidez
  const gammaBase = await sharp(Buffer.from(gammaSvg()), { density: 144 }).png().toBuffer();
  await bakeGlow(gammaBase, 'img/out/gamma-card.jpg');
}

main().catch((e) => { console.error(e); process.exit(1); });
