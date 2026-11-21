// Opens a browser window on YOUR computer for the LinkedIn update.
//
//   npm install            (once)
//   npm start              (Edge, falling back to Chrome)
//   npm start -- chrome    (pick the browser)
//
// - It starts your installed Edge (or Chrome) as a normal program, with its own separate
//   profile in ./browser-profile, so your normal browser, passwords and cookies are untouched.
//   It is NOT launched in automation mode, so "Sign in with Google" works.
// - You log in to LinkedIn yourself in this window. Your password is typed by you,
//   into LinkedIn, and is never read, stored or sent by this helper.
// - Claude then connects to this window (on this computer only, 127.0.0.1) to fill
//   in fields with step.mjs, one section at a time. It cannot click Save: you do.
// - Close the window (or press Ctrl+C here) to end the session.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 9333;

const pf = process.env["ProgramFiles"] || "C:\\Program Files";
const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
const local = process.env.LOCALAPPDATA || "";
const candidates = {
  msedge: [
    join(pf86, "Microsoft\\Edge\\Application\\msedge.exe"),
    join(pf, "Microsoft\\Edge\\Application\\msedge.exe"),
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/microsoft-edge",
  ],
  chrome: [
    join(pf, "Google\\Chrome\\Application\\chrome.exe"),
    join(pf86, "Google\\Chrome\\Application\\chrome.exe"),
    join(local, "Google\\Chrome\\Application\\chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ],
};

const wanted = process.argv[2];
const order = wanted ? [wanted] : ["msedge", "chrome"];
let exe, name;
for (const n of order) {
  exe = (candidates[n] || []).find((p) => existsSync(p));
  if (exe) { name = n; break; }
}
if (!exe) throw new Error(`Couldn't find ${order.join(" or ")} on this computer.`);

const child = spawn(
  exe,
  [
    `--remote-debugging-port=${PORT}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${join(here, "browser-profile")}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--start-maximized",
    "https://www.linkedin.com/login",
  ],
  { stdio: "ignore" },
);
console.log(`Opened ${name}.
  1. Log in to LinkedIn in the window that just opened (you type your password).
  2. Tell Claude "I'm logged in". Claude fills one section at a time and shows you.
  3. Check each section in the window and click Save yourself.

  Close the window or press Ctrl+C here to finish.
`);
child.on("exit", () => process.exit(0));
process.on("SIGINT", () => { child.kill(); process.exit(0); });
