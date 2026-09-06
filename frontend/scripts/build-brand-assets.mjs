/**
 * Rasterises the Ms Chole TOEIC mark straight from its geometry.
 *
 * The mark is a rounded tile, a circular arc with round caps, and one filled dot — simple
 * enough to draw exactly rather than shell out to a rasteriser, so the export runs anywhere
 * Node runs. Every value below matches public/brand/*.svg; change one, change both.
 *
 *   node scripts/build-brand-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'brand');

const INK = [0x26, 0x32, 0x38];
const GRASS = [0x58, 0xcc, 0x02];
const GOLD = [0xf4, 0xb9, 0x42];
const WHITE = [0xff, 0xff, 0xff];

/** Everything is expressed on the SVG's own 40×40 canvas and scaled at draw time. */
const VIEWBOX = 40;
const TILE_RADIUS = 11.5;
const ARC_CENTRE = 20;
const ARC_RADIUS = 10.5;
const ARC_WIDTH = 4.2;
const ARC_OPEN_DEG = 55; // the gap that turns the ring into a C, measured from the +x axis
const DOT = { x: 26.02, y: 11.4, r: 2.9 };

/** 4× supersampling, then a box downsample — enough to keep the 16px favicon clean. */
const SS = 4;

function coverage(shapeAt, width, height) {
  const alpha = new Float32Array(width * height);
  for (let y = 0; y < height * SS; y += 1) {
    for (let x = 0; x < width * SS; x += 1) {
      if (!shapeAt((x + 0.5) / SS, (y + 0.5) / SS)) continue;
      alpha[Math.floor(y / SS) * width + Math.floor(x / SS)] += 1;
    }
  }
  const factor = 1 / (SS * SS);
  for (let i = 0; i < alpha.length; i += 1) alpha[i] *= factor;
  return alpha;
}

/** Paints `colour` over the buffer wherever the shape covers it, respecting partial coverage. */
function paint(rgba, alpha, colour, width, height) {
  for (let i = 0; i < width * height; i += 1) {
    const a = alpha[i];
    if (a <= 0) continue;
    const at = i * 4;
    const dstA = rgba[at + 3] / 255;
    const outA = a + dstA * (1 - a);
    for (let channel = 0; channel < 3; channel += 1) {
      const src = colour[channel] / 255;
      const dst = rgba[at + channel] / 255;
      rgba[at + channel] = Math.round(((src * a + dst * dstA * (1 - a)) / (outA || 1)) * 255);
    }
    rgba[at + 3] = Math.round(outA * 255);
  }
}

function roundedTile(scale) {
  const r = TILE_RADIUS * scale;
  const size = VIEWBOX * scale;
  return (x, y) => {
    if (x < 0 || y < 0 || x > size || y > size) return false;
    const cx = Math.min(Math.max(x, r), size - r);
    const cy = Math.min(Math.max(y, r), size - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
}

function arcStroke(scale) {
  const cx = ARC_CENTRE * scale;
  const cy = ARC_CENTRE * scale;
  const radius = ARC_RADIUS * scale;
  const half = (ARC_WIDTH * scale) / 2;
  const open = (ARC_OPEN_DEG * Math.PI) / 180;
  // Round caps are the two end discs; the SVG uses stroke-linecap="round" for the same effect.
  const caps = [ARC_OPEN_DEG, -ARC_OPEN_DEG].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  });
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.hypot(dx, dy);
    if (Math.abs(distance - radius) <= half) {
      // atan2 with the y axis flipped back to maths orientation
      const angle = Math.atan2(-dy, dx);
      if (Math.abs(angle) >= open) return true;
    }
    return caps.some((cap) => (x - cap.x) ** 2 + (y - cap.y) ** 2 <= half * half);
  };
}

function disc(scale, { x: dx, y: dy, r }) {
  const cx = dx * scale;
  const cy = dy * scale;
  const radius = r * scale;
  return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius;
}

function renderMark({ size, tile, stroke, dot }) {
  const scale = size / VIEWBOX;
  const rgba = new Uint8Array(size * size * 4);
  if (tile) paint(rgba, coverage(roundedTile(scale), size, size), tile, size, size);
  paint(rgba, coverage(arcStroke(scale), size, size), stroke, size, size);
  if (dot) paint(rgba, coverage(disc(scale, DOT), size, size), dot, size, size);
  return rgba;
}

/* ---- minimal PNG writer: one IHDR, one IDAT, one IEND ---- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(rgba, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/** ICO is a small directory followed by whole PNGs, which every current browser accepts. */
function encodeIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32BE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    // ICO stores sizes little-endian; the length field above needs rewriting as LE
    entry.writeUInt32LE(png.length, 8);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map(({ png }) => png)]);
}

const VARIANTS = {
  'mark-dark': { tile: INK, stroke: GRASS, dot: GOLD },
  'mark-light': { tile: WHITE, stroke: GRASS, dot: GOLD },
  'mark-transparent': { tile: null, stroke: GRASS, dot: GOLD },
  'mark-mono-ink': { tile: null, stroke: INK, dot: INK },
  'mark-mono-white': { tile: null, stroke: WHITE, dot: WHITE }
};

const SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];

async function main() {
  await mkdir(OUT, { recursive: true });
  let written = 0;

  for (const [name, spec] of Object.entries(VARIANTS)) {
    for (const size of SIZES) {
      const png = encodePng(renderMark({ size, ...spec }), size);
      await writeFile(join(OUT, `${name}-${size}.png`), png);
      written += 1;
    }
  }

  // Favicons live at the web root so a bare /favicon.ico request still resolves.
  const root = join(ROOT, 'public');
  const icoSizes = [16, 32, 48];
  const icoPngs = icoSizes.map((size) => ({ size, png: encodePng(renderMark({ size, ...VARIANTS['mark-dark'] }), size) }));
  await writeFile(join(root, 'favicon.ico'), encodeIco(icoPngs));
  for (const size of [32, 180, 192, 512]) {
    const file = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    await writeFile(join(root, file), encodePng(renderMark({ size, ...VARIANTS['mark-dark'] }), size));
    written += 1;
  }

  console.log(`Brand assets written: ${written} PNG files plus favicon.ico`);
}

main().catch((error) => { console.error(error); process.exit(1); });
