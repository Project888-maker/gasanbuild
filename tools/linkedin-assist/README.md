# LinkedIn update with a human in the loop

Claude fills in the profile; Gasan logs in and approves every change.

## How it stays safe

- **Runs on Gasan's computer.** The browser window is on his screen, from his own internet
  connection, so LinkedIn sees a normal login from his usual place.
- **Separate browser profile** (`browser-profile/`, never committed): his normal browser,
  saved passwords and cookies are not touched.
- **Gasan types the password and any 2FA code himself**, into LinkedIn. The helper never
  reads, fills, stores or prints password fields.
- **Claude can't approve anything.** `step.mjs` refuses to click Save, Post, Publish, Send,
  Submit, Apply, Done, Delete, Connect, Follow and similar. Claude fills a section, shows a
  screenshot, and Gasan clicks Save in the window when he's happy with it.
- **Local only.** Claude connects to the window through 127.0.0.1 on his computer, through a
  Remote Control session he approves. Closing the window ends everything.

## Steps

1. On Gasan's computer: get this folder (clone the repo or download it), then once:
   `npm install` (uses his installed Chrome or Edge; nothing else to download).
2. Connect the folder to Claude: Claude desktop app → Settings → Claude Code → Remote Control
   → add this folder. (Or open a Claude Code session on the computer in this folder.)
3. `npm start` → a browser window opens on LinkedIn's login page → Gasan logs in.
4. Claude, section by section, from `docs/linkedin/profile.md`:
   `node step.mjs goto …`, `node step.mjs fill "Headline" @texts/headline.txt`, then shows the
   screenshot. Gasan checks the window and clicks **Save**.
5. Close the window when finished.
