import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public', {recursive:true});
await sharp('../highlands.png').resize(1100,619,{fit:'cover'}).webp({quality:78}).toFile('public/highlands.webp');
for (const size of [180,192,512]) {
  const svg=Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#191c1b"/><text x="256" y="337" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="330" letter-spacing="-20" fill="#bfdb9e">a.</text></svg>`);
  await sharp(svg).png().toFile(size===180?'public/apple-touch-icon.png':`public/icon-${size}.png`);
}
