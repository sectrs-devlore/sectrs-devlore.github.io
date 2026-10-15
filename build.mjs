import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify as minifyHtml } from "html-minifier-terser";
import { optimize as optimizeSvg } from "svgo";
import sharp from "sharp";

const DIST = "dist";

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

async function minifyFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") {
    const out = await minifyHtml(await readFile(file, "utf8"), {
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    });
    await writeFile(file, out);
  } else if (ext === ".svg") {
    const { data } = optimizeSvg(await readFile(file, "utf8"), { path: file, multipass: true });
    await writeFile(file, data);
  } else if (ext === ".png") {
    const out = await sharp(file).png({ compressionLevel: 9, effort: 10 }).toBuffer();
    await writeFile(file, out);
  } else if (ext === ".jpg" || ext === ".jpeg") {
    const out = await sharp(file).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    await writeFile(file, out);
  } else {
    return;
  }
  console.log(`minified ${file}`);
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST);

for (const entry of await readdir(".")) {
  if (entry.endsWith(".html")) await cp(entry, path.join(DIST, entry));
}
await cp("assets", path.join(DIST, "assets"), { recursive: true });

for await (const file of walk(DIST)) await minifyFile(file);
