import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = resolve(root, "public");

const mark = readFileSync(resolve(pub, "logo.svg"));
const appIcon = readFileSync(resolve(pub, "app-icon.svg"));

const jobs = [
  { svg: mark, size: 32, out: "favicon-32.png" },
  { svg: appIcon, size: 180, out: "apple-touch-icon.png" },
  { svg: appIcon, size: 192, out: "icon-192.png" },
  { svg: appIcon, size: 512, out: "icon-512.png" },
];

for (const { svg, size, out } of jobs) {
  await sharp(svg, { density: 384 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(resolve(pub, out));
  console.log(`✓ ${out} (${size}×${size})`);
}
