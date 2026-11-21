// Renders x/banner.html to x/banner.png at 3000x1000 (X header, 2x).
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1500, height: 500 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(join(here, "banner.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(here, "banner.png") });
await browser.close();
console.log("x/banner.png written");
