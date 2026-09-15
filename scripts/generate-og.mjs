#!/usr/bin/env node
/**
 * Genera public/og/default.jpg (1200×630) para las tarjetas sociales
 * cuando falta una imagen específica del proyecto.
 *
 * Ejecuta:  npm run og
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = resolve(ROOT, "public/og/default.jpg");

const SITE = "bill-mccoy.github.io";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0f1a"/>
      <stop offset="1" stop-color="#0d1422"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.75" cy="0.15" r="0.7">
      <stop offset="0" stop-color="#00e5ff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#00e5ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cad" cx="0.1" cy="0.9" r="0.6">
      <stop offset="0" stop-color="#ff6b2c" stop-opacity="0.1"/>
      <stop offset="1" stop-color="#ff6b2c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#00e5ff"/>
      <stop offset="0.5" stop-color="#38e8ff"/>
      <stop offset="1" stop-color="#ff6b2c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#cad)"/>
  <g fill="none" stroke="#1e2a3a" stroke-opacity="0.45">
    <path d="M150 0V630"/><path d="M300 0V630"/><path d="M450 0V630"/><path d="M600 0V630"/><path d="M750 0V630"/><path d="M900 0V630"/><path d="M1050 0V630"/>
    <path d="M0 90H1200"/><path d="M0 180H1200"/><path d="M0 270H1200"/><path d="M0 360H1200"/><path d="M0 450H1200"/><path d="M0 540H1200"/>
  </g>
  <rect x="90" y="90" width="46" height="46" rx="10" fill="#0a0f1a" stroke="url(#grad)" stroke-width="2"/>
  <text x="113" y="123" fill="url(#grad)" font-family="monospace" font-size="26" font-weight="700" text-anchor="middle">JC</text>
  <text x="620" y="300" fill="#e6ebf2" font-family="'Trebuchet MS', sans-serif" font-size="72" font-weight="700" text-anchor="middle">Juan Cortés</text>
  <text x="620" y="352" fill="#93a1b3" font-family="monospace" font-size="26" letter-spacing="10" text-anchor="middle">SOFTWARE × 3D × ENGINEERING</text>
  <text x="620" y="540" fill="#5c6b80" font-family="monospace" font-size="20" letter-spacing="3" text-anchor="middle">${SITE}</text>
</svg>`;

await mkdir(resolve(ROOT, "public/og"), { recursive: true });
await sharp(Buffer.from(svg)).png({ quality: 100 }).jpeg({ quality: 88 }).toFile(OUT);
console.log(`  ✓ ${OUT}`);