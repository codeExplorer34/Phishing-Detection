// Copies the angler animation into public/loader and writes a still copy (no SMIL tags) for visitors who
// prefer reduced motion. Run from webapp/:  node scripts/make_loader_svgs.mjs "../Fishing bye bye.svg"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const source = process.argv[2] ?? "../Fishing bye bye.svg";
const outDir = path.join("public", "loader");
const svg = readFileSync(source, "utf8");

if (!svg.trimStart().startsWith("<svg") || /<script|on\w+=/i.test(svg)) {
  throw new Error("Expected a plain SVG with no scripts or event handlers.");
}

const ANIMATE = /<animate(?:Transform|Motion)?\b[^>]*\/>|<animate(?:Transform|Motion)?\b[^>]*>[\s\S]*?<\/animate(?:Transform|Motion)?>/g;
const still = svg.replace(ANIMATE, "");

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "angler.svg"), svg);
writeFileSync(path.join(outDir, "angler-still.svg"), still);
console.log(`angler.svg ${svg.length} bytes, angler-still.svg ${still.length} bytes, ${(svg.match(ANIMATE) ?? []).length} animations removed`);
