import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pub = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public");
const svg = readFileSync(resolve(pub, "og-image.svg"));

await sharp(svg, { density: 144 })
  .resize(1200, 630)
  .png()
  .toFile(resolve(pub, "og-image.png"));

console.log("✓ og-image.png (1200×630)");
