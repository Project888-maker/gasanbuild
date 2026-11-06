// One small action in the open LinkedIn window, run by Claude. Every action ends
// with a screenshot (shots/latest.png) so Claude and Gasan see the same thing.
//
//   node step.mjs status
//   node step.mjs goto <url>
//   node step.mjs fill "<field label>" <text | @file.txt>
//   node step.mjs click "<visible text>"         (never Save/Post/Publish/Apply/Done)
//   node step.mjs upload "<input label or css>" <file>
//   node step.mjs fields                          (lists the form fields on screen)
//
// Safety:
// - Connects only to the window on this computer (127.0.0.1) opened by start-browser.mjs.
// - Never reads, fills or prints password fields.
// - Refuses to click anything that saves, posts, publishes, sends or deletes:
//   those clicks are Gasan's approval and stay his.

import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const FORBIDDEN = /^\s*(save|post|publish|send|submit|apply|done|delete|remove|confirm|share|repost|connect|follow|accept)\b/i;
const [action, target, value] = process.argv.slice(2);

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const context = browser.contexts()[0];
const page = context.pages().find((p) => p.url().includes("linkedin.com")) || context.pages()[0];
await page.bringToFront();

const text = (v) => (v?.startsWith("@") ? readFileSync(join(here, v.slice(1)), "utf8") : v ?? "");

async function shot() {
  mkdirSync(join(here, "shots"), { recursive: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(here, "shots", "latest.png") });
  console.log(`url: ${page.url()}\nscreenshot: shots/latest.png`);
}

async function field(label) {
  const byLabel = page.getByLabel(label, { exact: false }).first();
  if (await byLabel.count()) return byLabel;
  const byPlaceholder = page.getByPlaceholder(label, { exact: false }).first();
  if (await byPlaceholder.count()) return byPlaceholder;
  return page.locator(label).first();
}

switch (action) {
  case "status":
    break;
  case "goto":
    if (!/^https:\/\/([a-z]+\.)?linkedin\.com\//.test(target || "")) throw new Error("Only linkedin.com pages.");
    await page.goto(target, { waitUntil: "domcontentloaded" });
    break;
  case "fields": {
    const items = await page.$$eval("input, textarea, [contenteditable=true], select", (els) =>
      els
        .filter((e) => e.offsetParent !== null && e.getAttribute("type") !== "password" && e.getAttribute("type") !== "hidden")
        .map((e) => {
          const id = e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`);
          return `${e.tagName.toLowerCase()} | label: ${(id?.textContent || e.getAttribute("aria-label") || e.getAttribute("placeholder") || e.getAttribute("name") || "").trim().slice(0, 80)}`;
        }),
    );
    console.log(items.join("\n") || "(no fields visible)");
    break;
  }
  case "fill": {
    const el = await field(target);
    if ((await el.getAttribute("type")) === "password") throw new Error("Password fields are yours to type.");
    const editable = (await el.getAttribute("contenteditable")) === "true";
    if (editable) {
      await el.click();
      await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await page.keyboard.insertText(text(value));
    } else {
      await el.fill(text(value));
    }
    console.log(`filled "${target}"`);
    break;
  }
  case "click": {
    if (FORBIDDEN.test(target || "")) throw new Error(`"${target}" is your approval click: please click it yourself in the window.`);
    const el = page.getByRole("button", { name: target }).or(page.getByRole("link", { name: target })).or(page.getByText(target, { exact: true })).first();
    const label = ((await el.innerText().catch(() => "")) || (await el.getAttribute("aria-label")) || "").trim();
    if (FORBIDDEN.test(label)) throw new Error(`"${label}" is your approval click: please click it yourself in the window.`);
    await el.click();
    console.log(`clicked "${target}"`);
    break;
  }
  case "upload": {
    const input = page.locator(target.startsWith("input") ? target : "input[type=file]").first();
    await input.setInputFiles(join(here, value));
    console.log(`attached ${value}`);
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(0, 17).join("\n"));
    process.exit(1);
}
await shot();
await browser.close(); // disconnects; the window stays open
