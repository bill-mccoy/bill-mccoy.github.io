// Smoke test honesto: revisa el build (dist/) por enlaces rotos evidentes.
// No promete cobertura total: solo href="#" / href vacios e internos sin archivo.
// Uso: npm run build && node scripts/check-links.mjs
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const htmlFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
};
walk(root);

let failures = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (href === "#" || href === "") {
      console.error(`FAIL ${file}: enlace vacio href="${href}"`);
      failures++;
      continue;
    }
    if (href.startsWith("/") && !href.startsWith("//")) {
      const path = href.split("#")[0].split("?")[0];
      const candidates = [
        join(root, path),
        join(root, path, "index.html"),
        join(root, `${path}.html`),
      ];
      if (!candidates.some((c) => existsSync(c))) {
        console.error(`FAIL ${file}: interno sin archivo ${href}`);
        failures++;
      }
    }
  }
}

if (htmlFiles.length === 0) {
  console.error("FAIL: sin HTML en dist/ (olvidaste npm run build?)");
  process.exit(1);
}
if (failures > 0) {
  console.error(`${failures} enlace(s) roto(s).`);
  process.exit(1);
}
console.log(`OK: ${htmlFiles.length} paginas, sin href="#" ni internos rotos.`);
