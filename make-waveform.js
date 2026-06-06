const sharp = require('sharp');
const path = require('path');

const W = 900, H = 320;
const cx = W / 2, midY = 150;
const barW = 8, gap = 9, step = barW + gap;
const n = Math.floor((W - 80) / step);
const startX = (W - (n * step - gap)) / 2;

// organic symmetric waveform heights
function h(i) {
  const t = (i - (n - 1) / 2) / (n / 2);
  const env = Math.cos(t * 1.2) ** 2;
  const wig = Math.abs(Math.sin(i * 1.7) * 0.55 + Math.sin(i * 0.6) * 0.45);
  return Math.max(10, (16 + env * 110 * wig));
}

let bars = '';
for (let i = 0; i < n; i++) {
  const bh = h(i);
  const x = startX + i * step;
  const y = midY - bh / 2;
  bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" rx="${barW / 2}" fill="url(#g)"/>`;
}

// mic circle
const micY = 250, micR = 34;
const mic = `
<circle cx="${cx}" cy="${micY}" r="${micR}" fill="url(#g)"/>
<g fill="#0B1020">
  <rect x="${cx - 7}" y="${micY - 18}" width="14" height="22" rx="7"/>
  <path d="M ${cx - 13} ${micY - 2} a 13 13 0 0 0 26 0" fill="none" stroke="#0B1020" stroke-width="3"/>
  <rect x="${cx - 1.5}" y="${micY + 9}" width="3" height="8"/>
  <rect x="${cx - 8}" y="${micY + 16}" width="16" height="3" rx="1.5"/>
</g>`;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7FB6E8"/>
    <stop offset="1" stop-color="#3E8FD4"/>
  </linearGradient>
</defs>
${bars}
${mic}
</svg>`;

sharp(Buffer.from(svg), { density: 200 })
  .png()
  .toFile(path.join(__dirname, 'img', 'out', 'gamma-waveform.png'))
  .then(() => console.log('waveform ok', n, 'bars'))
  .catch(console.error);
