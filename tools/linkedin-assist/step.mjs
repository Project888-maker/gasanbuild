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
const onLinkedIn = (p) => { try { return /(^|\.)(linkedin\.com|x\.com|twitter\.com)$/.test(new URL(p.url()).hostname); } catch { return false; } };
const page = context.pages().find(onLinkedIn) || context.pages()[0];
await page.bringToFront();

const text = (v) => (v?.startsWith("@") ? readFileSync(join(here, v.slice(1)), "utf8").trimEnd() : v ?? "");

async function shot() {
  mkdirSync(join(here, "shots"), { recursive: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(here, "shots", "latest.png") });
  console.log(`url: ${page.url()}\nscreenshot: shots/latest.png`);
}

async function field(label) {
  const byLabel = page.getByLabel(label, { exact: false }).filter({ visible: true }).first();
  if (await byLabel.count()) return byLabel;
  const byPlaceholder = page.getByPlaceholder(label, { exact: false }).filter({ visible: true }).first();
  if (await byPlaceholder.count()) return byPlaceholder;
  return page.locator(label).first();
}

switch (action) {
  case "status":
    break;
  case "goto":
    if (!/^https:\/\/([a-z]+\.)?(linkedin\.com|x\.com)\//.test(target || "")) throw new Error("Only linkedin.com and x.com pages.");
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
  case "openfill": // node step.mjs openfill "<button>" "<field>" <text|@file>: dialogs opened by a click close when the next command connects, so open and fill in one go
  case "fill": {
    let fieldLabel = target, fillValue = value;
    if (action === "openfill") {
      if (FORBIDDEN.test(target || "")) throw new Error(`"${target}" is your approval click: please click it yourself in the window.`);
      await page.getByRole("button", { name: target }).or(page.getByRole("link", { name: target })).first().click();
      fieldLabel = value;
      fillValue = process.argv[5];
      await page.waitForTimeout(1500);
    }
    const el = await field(fieldLabel);
    if ((await el.getAttribute("type")) === "password") throw new Error("Password fields are yours to type.");
    const editable = (await el.getAttribute("contenteditable")) === "true";
    if (editable) {
      await el.click();
      await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await page.keyboard.insertText(text(fillValue));
    } else {
      await el.fill(text(fillValue));
    }
    console.log(`filled "${fieldLabel}"`);
    break;
  }
  case "click": {
    if (FORBIDDEN.test(target || "")) throw new Error(`"${target}" is your approval click: please click it yourself in the window.`);
    const el = page.getByRole("button", { name: target }).or(page.getByRole("link", { name: target })).or(page.getByText(target, { exact: true })).filter({ visible: true }).first();
    const label = ((await el.innerText().catch(() => "")) || (await el.getAttribute("aria-label")) || "").trim();
    if (FORBIDDEN.test(label)) throw new Error(`"${label}" is your approval click: please click it yourself in the window.`);
    await el.click();
    console.log(`clicked "${target}"`);
    break;
  }
  case "upload": {
    // `upload "input[...]" file` sets a file input directly; `upload "<button text>" file`
    // clicks that button and answers the file picker it opens (no Windows dialog).
    if (target.startsWith("input")) {
      await page.locator(target).first().setInputFiles(join(here, value));
    } else {
      if (FORBIDDEN.test(target)) throw new Error(`"${target}" is your approval click: please click it yourself in the window.`);
      const button = page.getByRole("button", { name: target }).or(page.getByText(target, { exact: true })).filter({ visible: true }).first();
      const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 10000 }), button.click()]);
      await chooser.setFiles(join(here, value));
    }
    console.log(`attached ${value}`);
    break;
  }
  case "steps": {
    // node step.mjs steps <file.json>: several clicks/fills in one connection, because
    // LinkedIn closes click-opened dialogs when the next command connects.
    // [{"click":"Add section"},{"wait":1000},{"fill":"URL","value":"https://..."}]
    // Same safety rules: approval buttons are refused, password fields are refused.
    for (const s of JSON.parse(readFileSync(target, "utf8"))) {
      if (s.wait) { await page.waitForTimeout(s.wait); continue; }
      if (s.select) { // {"select":"Start month","value":"April"} picks a dropdown option by its text
        await (await field(s.select)).selectOption({ label: s.value }, { timeout: 15000 });
        console.log(`selected "${s.value}" in "${s.select}"`);
        await page.waitForTimeout(s.after ?? 500);
        continue;
      }
      if (s.check) { // {"check":"I currently work here"} ticks a checkbox (never unticks)
        await (await field(s.check)).check({ force: true, timeout: 15000 });
        console.log(`ticked "${s.check}"`);
        await page.waitForTimeout(s.after ?? 500);
        continue;
      }
      if (s.pick) { // {"pick":"London, England, United Kingdom"} clicks a suggestion from a type-ahead list
        await page.getByRole("option", { name: s.pick }).or(page.getByText(s.pick, { exact: true })).filter({ visible: true }).first().click({ timeout: 8000 })
          .then(() => console.log(`picked "${s.pick}"`), () => console.log(`no suggestion "${s.pick}", left as typed`));
        await page.waitForTimeout(s.after ?? 500);
        continue;
      }
      if (s.click) {
        if (FORBIDDEN.test(s.click)) throw new Error(`"${s.click}" is your approval click.`);
        const el = page.getByRole("button", { name: s.click, exact: !!s.exact }).or(page.getByRole("link", { name: s.click, exact: !!s.exact })).or(page.getByText(s.click, { exact: true })).filter({ visible: true }).first();
        const label = ((await el.innerText().catch(() => "")) || (await el.getAttribute("aria-label")) || "").trim();
        if (FORBIDDEN.test(label)) throw new Error(`"${label}" is your approval click.`);
        await el.click({ timeout: 15000 });
        console.log(`clicked "${s.click}"`);
        await page.waitForTimeout(s.after ?? 1200);
      }
      if (s.fill) {
        const el = await field(s.fill);
        if ((await el.getAttribute("type")) === "password") throw new Error("Password fields are yours to type.");
        if ((await el.getAttribute("contenteditable")) === "true") {
          await el.click();
          await page.keyboard.press("Control+A");
          await page.keyboard.insertText(text(s.value));
        } else {
          await el.fill(text(s.value), { timeout: 15000 });
        }
        console.log(`filled "${s.fill}"`);
        await page.waitForTimeout(s.after ?? 800);
      }
    }
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(0, 17).join("\n"));
    process.exit(1);
}
await shot();
await browser.close(); // disconnects; the window stays open
