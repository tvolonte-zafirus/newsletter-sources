/**
 * 1) Recorta el aire transparente de los PNG de teléfonos (para que el celular
 *    "llene" su columna y no quede tanto espacio vacío alrededor).
 * 2) Genera img/out/gamma-card.png: una mock vertical del registro médico
 *    estructurado por voz (mismo formato vertical que los teléfonos),
 *    usando SOLO la paleta de marca.
 *
 * USO: node make-card-images.js
 */
const sharp = require('sharp');
const path = require('path');

const P = (f) => path.join(__dirname, f);

async function trim(file) {
  const buf = await sharp(P(file)).trim({ threshold: 10 }).toBuffer();
  await sharp(buf).toFile(P(file));
  const m = await sharp(P(file)).metadata();
  console.log('trim', file, '->', m.width + 'x' + m.height);
}

// ---- Gamma card (vertical) ----
const W = 640, H = 860;

function bars() {
  const heights = [18,34,52,30,64,40,74,46,88,58,96,62,80,44,70,36,58,28,42,20,
                   30,52,38,68,48,86,56,92,60,78,42,64,34,50,26,40,22,32,18,28];
  const bw = 9, gap = 6, x0 = 56, mid = 250;
  return heights.map((h, i) => {
    const x = x0 + i * (bw + gap);
    const col = i % 3 === 0 ? '#4C9BD5' : '#3983B8';
    return `<rect x="${x}" y="${mid - h / 2}" width="${bw}" height="${h}" rx="4" fill="${col}"/>`;
  }).join('');
}

function field(y, label, val, valColor) {
  return `
    <text x="56" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" letter-spacing="2" fill="#3983B8">${label}</text>
    <text x="56" y="${y + 38}" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="bold" fill="${valColor}">${val}</text>
    <rect x="56" y="${y + 58}" width="528" height="1" fill="#23364f"/>`;
}

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16294a"/>
      <stop offset="100%" stop-color="#0f1d33"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="40" fill="url(#card)" stroke="#23364f" stroke-width="2"/>

  <!-- pill grabando -->
  <rect x="56" y="56" width="220" height="48" rx="24" fill="#101D30"/>
  <circle cx="86" cy="80" r="9" fill="#4C9BD5"/>
  <text x="108" y="88" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" letter-spacing="2" fill="#E5E5E5">GRABANDO</text>
  <text x="${W - 56}" y="88" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#4C9BD5">00:42</text>

  <!-- waveform -->
  ${bars()}
  <text x="56" y="330" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" letter-spacing="3" fill="#4C9BD5">TRANSCRIBIENDO VOZ &#8594; CAMPOS CL&#205;NICOS</text>
  <rect x="56" y="352" width="528" height="2" fill="#23364f"/>

  ${field(430, 'MOTIVO DE CONSULTA', 'Control y dolor lumbar', '#FFFFFF')}
  ${field(540, 'DIAGN&#211;STICO', 'Lumbalgia mec&#225;nica', '#FFFFFF')}
  ${field(650, 'INDICACIONES', 'Reposo relativo + AINE', '#FFFFFF')}
  ${field(760, 'PR&#211;XIMO CONTROL', '15 d&#237;as', '#4C9BD5')}
</svg>`;

async function main() {
  await trim('img/phones/federada-phone.png');
  await trim('img/phones/espanol-phones.png');
  await sharp(Buffer.from(svg)).png().toFile(P('img/out/gamma-card.png'));
  const m = await sharp(P('img/out/gamma-card.png')).metadata();
  console.log('gamma-card', m.width + 'x' + m.height);
}

main().catch((e) => { console.error(e); process.exit(1); });
