/**
 * Envía el newsletter de Zafirus por Gmail con las imágenes INCRUSTADAS (CID).
 * No requiere hostear imágenes en ningún servidor.
 *
 * USO:
 *   1. Configurá las credenciales abajo (o por variables de entorno).
 *   2. Probar sin enviar:   node send.js --dry
 *   3. Enviar de verdad:    node send.js destinatario@correo.com
 *
 * CREDENCIALES DE GMAIL:
 *   Gmail NO acepta tu contraseña normal. Necesitás una "Contraseña de aplicación":
 *   - Activá la verificación en 2 pasos en tu cuenta Google.
 *   - Andá a https://myaccount.google.com/apppasswords
 *   - Generá una y pegala abajo en GMAIL_APP_PASSWORD (son 16 letras).
 *
 * SEGURIDAD: no subas este archivo con la contraseña a git/repos públicos.
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// ============ CONFIG ============
const GMAIL_USER = process.env.GMAIL_USER || 'tu-cuenta@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'xxxx xxxx xxxx xxxx';
const FROM_NAME = 'Zafirus';
const SUBJECT = 'La IA no se implementa sola — Casos de Éxito 2026';
// ================================

// Mapa: ruta del archivo  ->  cid usado en el HTML
const IMAGES = {
  'img/out/zafirus.png':          'zafirus',
  'img/out/federada.png':         'federada',
  'img/out/hospital-espanol.png': 'hospitalespanol',
  'img/out/gamma.png':            'gamma',
  'img/out/gamma-waveform.png':   'wave',
  'img/phones/federada-phone.png':'federadaphone',
  'img/phones/espanol-phones.png':'espanolphones',
};

function buildHtmlAndAttachments() {
  let html = fs.readFileSync(path.join(__dirname, 'newsletter.html'), 'utf8');
  const attachments = [];

  for (const [file, cid] of Object.entries(IMAGES)) {
    const abs = path.join(__dirname, file);
    if (!fs.existsSync(abs)) {
      throw new Error(`Falta la imagen: ${file}`);
    }
    // Reemplaza src="img/..."  ->  src="cid:..."
    html = html.split(`src="${file}"`).join(`src="cid:${cid}"`);
    attachments.push({ filename: path.basename(file), path: abs, cid });
  }

  // Aviso si quedó alguna ruta de imagen sin mapear
  const leftover = html.match(/src="img\/[^"]+"/g);
  if (leftover) {
    console.warn('AVISO: estas imágenes no están en el mapa IMAGES y no se incrustarán:\n', leftover.join('\n'));
  }

  return { html, attachments };
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const to = args.find((a) => a.includes('@'));

  if (!dry && !to) {
    console.error('Falta el destinatario.  Ej: node send.js alguien@correo.com   (o "node send.js --dry" para probar)');
    process.exit(1);
  }

  const { html, attachments } = buildHtmlAndAttachments();
  console.log(`HTML listo. Imágenes incrustadas: ${attachments.length}`);

  if (dry) {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${GMAIL_USER}>`,
      to: 'prueba@ejemplo.com',
      subject: SUBJECT,
      html,
      attachments,
    });
    const totalSize = Buffer.byteLength(info.message);
    const htmlSize = Buffer.byteLength(html);
    console.log('DRY-RUN OK. El mail se arma correctamente.');
    console.log(`HTML del cuerpo: ${(htmlSize / 1024).toFixed(0)} KB ${htmlSize > 102400 ? '(OJO: >102KB, Gmail recorta)' : '(ok, sin recorte)'}`);
    console.log(`Mail completo con imágenes: ${(totalSize / 1024).toFixed(0)} KB (los adjuntos no cuentan para el recorte de Gmail)`);
    return;
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const info = await transport.sendMail({
    from: `"${FROM_NAME}" <${GMAIL_USER}>`,
    to,
    subject: SUBJECT,
    html,
    attachments,
  });

  console.log('Enviado a', to);
  console.log('Message ID:', info.messageId);
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
