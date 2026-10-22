import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
// Preserve the full user-supplied logo for page branding.
// Installation icons focus on the distinctive dome and mosque so the logo stays legible at 48px.
const source = await readFile('public/brand/logo.webp');
const full=sharp(source);
const meta=await full.metadata();
if (!meta.width||!meta.height||meta.width<400) throw new Error('Source logo must be at least 400px wide.');
const cropHeight=Math.round(meta.height*0.72);
const crop=await sharp(source).extract({left:0,top:0,width:meta.width,height:cropHeight}).png().toBuffer();
const BG={r:8,g:39,b:103,alpha:1};
async function icon(path,size,inset){
 const inner=size-inset*2;
 const art=await sharp(crop).resize({width:inner,height:inner,fit:'contain'}).png().toBuffer();
 await sharp({create:{width:size,height:size,channels:4,background:BG}})
  .composite([{input:art,gravity:'centre'}]).png({compressionLevel:9}).toFile(path);
}
await mkdir('public/icons',{recursive:true});
await icon('public/icons/icon-192.png',192,11);
await icon('public/icons/icon-512.png',512,28);
await icon('public/icons/icon-maskable-512.png',512,90);
await icon('public/apple-touch-icon.png',180,13);
await icon('public/favicon.png',192,11);
console.log('[MASAJIDALLOH PRO] HQ icons created from official logo emblem.');
