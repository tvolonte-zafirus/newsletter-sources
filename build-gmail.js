/**
 * Genera newsletter-gmail.html a partir de newsletter.html,
 * reemplazando los src="img/..." locales por URLs publicas de jsDelivr (GitHub).
 *
 * USO:  node build-gmail.js
 *
 * Si en el futuro cambias una imagen: hace git push y volve a correr esto.
 * Nota: jsDelivr cachea ~7 dias por path. Para forzar refresco inmediato,
 * cambia CDN_REF de "@main" a "@<commit-hash>" (el hash del ultimo commit).
 */

const fs = require('fs');
const path = require('path');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/tvolonte-zafirus/newsletter-sources';
const CDN_REF = '@c05263e4c3ac5f3d24df465cb14666c7feb1c21e'; // commit fijo: evita el cache de jsDelivr

const LOCAL_PATHS = [
  'img/out/zafirus.png',
  'img/out/federada.png',
  'img/out/hospital-espanol.png',
  'img/out/gamma.png',
  'img/out/gamma-card.png',
  'img/phones/federada-phone.png',
  'img/phones/espanol-phones.png',
];

let html = fs.readFileSync(path.join(__dirname, 'newsletter.html'), 'utf8');

for (const local of LOCAL_PATHS) {
  const url = `${CDN_BASE}${CDN_REF}/${local}`;
  const before = html;
  html = html.split(`src="${local}"`).join(`src="${url}"`);
  if (before === html) {
    console.warn(`AVISO: no se encontro src="${local}" en newsletter.html`);
  }
}

const leftover = html.match(/src="img\/[^"]+"/g);
if (leftover) {
  console.warn('AVISO: estas rutas locales quedaron sin reemplazar:\n', leftover.join('\n'));
}

const out = path.join(__dirname, 'newsletter-gmail.html');
fs.writeFileSync(out, html, 'utf8');
console.log('OK -> newsletter-gmail.html listo para pegar en Gmail.');
console.log(`Imagenes apuntando a: ${CDN_BASE}${CDN_REF}/...`);
