// Fills LinkedIn's "Add skill" form one skill at a time, waiting for Gasan to save each one.
//
//   node skills-loop.mjs "Voice AI" "Python" ...
//
// For each skill: waits until the Add skill form is open and its Skill box is empty (Gasan
// just saved the previous one), types the skill and picks LinkedIn's matching suggestion.
// Gasan ticks where he used it and clicks Save. This script never clicks Save.

import { chromium } from "playwright";

const skills = process.argv.slice(2);
const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const page = browser.contexts()[0].pages().find((p) => { try { return /(^|\.)linkedin\.com$/.test(new URL(p.url()).hostname); } catch { return false; } });

const box = () => page.getByPlaceholder("Skill (ex: Project Management)").filter({ visible: true }).first();

for (const [i, skill] of skills.entries()) {
  // Wait (up to 10 minutes) for an empty, open Skill box.
  const deadline = Date.now() + 10 * 60 * 1000;
  for (;;) {
    if (Date.now() > deadline) { console.log(`stopped: no empty Add skill form for 10 minutes (next was "${skill}")`); process.exit(0); }
    const b = box();
    if ((await b.count()) && (await b.inputValue().catch(() => "x")) === "") break;
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(800);
  await box().click();
  await box().pressSequentially(skill, { delay: 40 });
  await page.waitForTimeout(2500);
  const options = page.getByRole("option").filter({ visible: true });
  const n = await options.count();
  let chosen = null;
  for (let k = 0; k < n; k++) {
    const t = ((await options.nth(k).innerText().catch(() => "")) || "").split("\n")[0].trim();
    if (t.toLowerCase() === skill.toLowerCase()) { chosen = k; break; }
    if (chosen === null && t.toLowerCase().includes(skill.toLowerCase())) chosen = k;
  }
  if (chosen === null && n) chosen = 0;
  if (chosen !== null) {
    const label = ((await options.nth(chosen).innerText()) || "").split("\n")[0].trim();
    await options.nth(chosen).click();
    console.log(`${i + 1}/${skills.length} ready: "${label}" (typed "${skill}") - tick where used, then Save`);
  } else {
    console.log(`${i + 1}/${skills.length} typed "${skill}" but LinkedIn offered no suggestion - pick one or clear it`);
  }
  // Wait until this skill's form is saved (box disappears or empties) before moving on.
  await page.waitForTimeout(3000);
}
console.log("all skills filled");
await browser.close();
