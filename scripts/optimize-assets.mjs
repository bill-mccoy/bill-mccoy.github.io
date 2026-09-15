#!/usr/bin/env node
/**
 * Optimiza los assets de proyectos para el portafolio.
 *
 * 1. Deja tus originales (PNG, JPG, TIFF...) en:
 *      src/assets/_source/<proyecto>/renders/      (imágenes de galería / CAD)
 *      src/assets/_source/<proyecto>/fotos/        (fotografías del proceso)
 *    (carpeta ignorada por git — los originales nunca se publican)
 *
 * 2. Ejecuta:  npm run assets
 *
 * 3. Genera en public/projects/<proyecto>/<kind>/<nombre>.webp + .avif
 *    redimensionados a MAX_WIDTH con conversión lossy.
 *
 * 4. Referencia los archivos generados en el front-matter de
 *    src/content/projects/<slug>.md  (campo `image` y `gallery[].src`).
 *
 * Opciones:
 *   npm run assets -- --width=1920   ajusta el ancho máximo
 */
import { readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = resolve(ROOT, "src/assets/_source");
const OUT_ROOT = resolve(ROOT, "public/projects");

const IMAGE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
  ".bmp",
]);
const MAX_WIDTH = Number(process.argv.find((a) => a.startsWith("--width="))?.split("=")[1] ?? 1600);
const QUALITIES = { webp: 78, avif: 60 };

function usage() {
  console.log(`Sin originales en src/assets/_source/.
Crea carpetas como:
  src/assets/_source/terraworks/renders/
  src/assets/_source/7points/fotos/
y coloca ahí tus renders/fotos antes de ejecutar "npm run assets".`);
}

async function exists(p) {
  return stat(p).then(() => true, () => false);
}

async function main() {
  if (!(await exists(SOURCE))) {
    usage();
    process.exit(0);
  }

  const projects = await readdir(SOURCE, { withFileTypes: true });
  if (projects.length === 0) {
    usage();
    process.exit(0);
  }

  let total = 0;
  let skipped = 0;

  for (const projectEnt of projects) {
    if (!projectEnt.isDirectory()) continue;
    const project = projectEnt.name;
    const projectSrc = join(SOURCE, project);
    const kinds = await readdir(projectSrc, { withFileTypes: true });

    for (const kindEnt of kinds) {
      if (!kindEnt.isDirectory()) continue;
      const kind = kindEnt.name;
      if (!["renders", "fotos"].includes(kind)) {
        console.log(`  · omitiendo subcarpeta no reconocida: ${project}/${kind}`);
        continue;
      }

      const kindSrc = join(projectSrc, kind);
      const outDir = join(OUT_ROOT, project, kind);
      const files = await readdir(kindSrc);

      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!IMAGE_EXT.has(ext) || file.startsWith(".")) continue;

        const srcPath = join(kindSrc, file);
        const base = file.replace(ext, "");
        const srcStat = await stat(srcPath);

        let generated = 0;
        for (const [format, quality] of Object.entries(QUALITIES)) {
          const outPath = join(outDir, `${base}.${format}`);
          const outStat = await exists(outPath);
          if (outStat && srcStat.mtimeMs <= outStat.mtimeMs) {
            skipped++;
            continue;
          }
          await sharp(srcPath)
            .resize({
              width: MAX_WIDTH,
              withoutEnlargement: true,
            })
            .rotate()
            [format]({ quality })
            .toFile(outPath);
          console.log(`  ✓ ${relative(ROOT, outPath)}`);
          generated++;
        }
        total += generated;
      }
    }
  }

  console.log(`\nListo: ${total} archivos generados${skipped ? ` (${skipped} ya actualizados)` : ""}.
Referencia cada uno desde src/content/projects/<slug>.md
Reemplazo: /placeholders/... → /projects/<proyecto>/<kind>/<nombre>.webp (o .avif)
Videos: deja el .mp4 en public/projects/<proyecto>/reels/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});