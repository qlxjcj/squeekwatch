// Renders assets/squeekwatch-card.svg to PNG (headline image for the
// Squeekchain Genesis submission form). Run: node scripts/render-card.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = new URL("..", import.meta.url);
const svg = readFileSync(fileURLToPath(new URL("assets/squeekwatch-card.svg", root)));
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1024 },
  font: { loadSystemFonts: true },
});
const png = resvg.render().asPng();
writeFileSync(fileURLToPath(new URL("assets/squeekwatch-card.png", root)), png);
console.log(`wrote assets/squeekwatch-card.png (${png.length} bytes)`);
