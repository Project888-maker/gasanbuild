// Opens a browser window on YOUR computer for the LinkedIn update.
//
//   npm install            (once)
//   npm start
//
// - It uses your installed Chrome (or Edge) with its own separate profile in
//   ./browser-profile, so your normal browser, passwords and cookies are untouched.
// - You log in to LinkedIn yourself in this window. Your password is typed by you,
//   into LinkedIn, and is never read, stored or sent by this helper.
// - Claude then connects to this window (on this computer only, 127.0.0.1) to fill
//   in fields with step.mjs, one section at a time. It cannot click Save: you do.
// - Close the window (or press Ctrl+C here) to end the session.

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 9333;

async function open(channel) {
  return chromium.launchPersistentContext(join(here, "browser-profile"), {
    channel,
    headless: false,
    viewport: null,
    args: [`--remote-debugging-port=${PORT}`, "--remote-debugging-address=127.0.0.1", "--start-maximized"],
  });
}

let context;
for (const channel of ["chrome", "msedge", undefined]) {
  try {
    context = await open(channel);
    console.log(`Opened ${channel || "Chromium"}.`);
    break;
  } catch (e) {
    if (channel === undefined) throw e;
  }
}

const page = context.pages()[0] || (await context.newPage());
await page.goto("https://www.linkedin.com/login");
console.log(`
  1. Log in to LinkedIn in the window that just opened (you type your password).
  2. Tell Claude "I'm logged in". Claude fills one section at a time and shows you.
  3. Check each section in the window and click Save yourself.

  Close the window or press Ctrl+C here to finish.
`);
context.on("close", () => process.exit(0));
await new Promise(() => {});
