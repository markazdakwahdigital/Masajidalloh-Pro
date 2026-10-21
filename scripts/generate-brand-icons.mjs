import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
const source = await readFile('public/brand/logo.webp');
const BG = { r: 10, g: 43, b: 115, alpha: 1 };
async function icon(path, size, inset) {
  const inner = size - inset * 2;
  const image = await sharp(source).resize({ width: inner, height: inner, fit: 'contain' }).png().toBuffer();
  await sharp({ create: { width:size, height:size, channels:4, background:BG } })
    .composite([{ input:image, gravity:'centre' }]).png({compressionLevel:9}).toFile(path);
}
await mkdir('public/icons', {recursive:true});
await icon('public/icons/icon-192.png',192,12);
await icon('public/icons/icon-512.png',512,32);
await icon('public/icons/icon-maskable-512.png',512,88);
await icon('public/apple-touch-icon.png',180,13);
await icon('public/favicon.png',192,12);
console.log('[MASAJIDALLOH PRO] Branded install icons generated.');
