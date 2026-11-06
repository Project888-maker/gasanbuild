# gasanbuild: portfolio + Jasmin, plan for review

Status: **approved 2026-11-05; phases 0–1 built.**

## Decisions (Gasan, 2026-11-05)

| Question | Decision |
|---|---|
| Public chat | Yes: a live text chat for everyone, hard cap **$1/day** for the whole site (20 messages per visitor per day) |
| Approvals | Telegram buttons through Hermes, plus an admin page as backup |
| Jasmin's title | **AI Chief of Staff** |
| Site | Vercel project **gasanbuildsai** (root directory `web/`) |
| Live Jasmin | Her own service on Gasan's server, next to Hermes |
| First full chapter | Hermes + Jasmin |
| Dentalscaner | Free for patients; the old 15% deposit model must not appear anywhere |

## Progress

- Done: project dossiers (`web/src/content/projects.ts`), Jasmin's work persona and a
  draft "about Gasan" (`web/src/content/jasmin.ts`, **needs Gasan's approval**), site with
  home, `/work`, all ten chapters (Hermes fully finished), `/jasmin` with the interview form,
  guided tour on the Stage engine, chat API with the daily cap, Neon database
  (`gasanbuildsai`, London region), first films and posters on fal (`media/`).
- Chat runs on Gemini Flash through fal's OpenRouter route, billed to the fal account,
  about $0.002 per answer.
- 2026-11-06: Jasmin's office look remade from her real reference portrait (kept out of
  git). Voice-overs in her cloned ElevenLabs voice (`njynYTWWtWecayrQg0HZ`, key injected
  by the environment proxy) for the greeting and all nine tour steps; lip-synced clips on
  OmniHuman v2 (`media/voice.py`). The tour speaks and advances when she finishes.
- Creator story from Hermes's story bank (`web/src/content/story.ts`), shown as a pinned
  horizontal reel and known to Jasmin. Off limits: health, family, income.
- Interview requests reach Jasmin's Telegram bot with signed Approve 20 / Approve 45 /
  Decline links (`/api/interview/decide`); no webhook, so Hermes's polling is untouched.
- The repo is public: secrets live only in Vercel env vars and `web/.env.local`
  (git-ignored).
- Vercel auto-created the project as `gasanbuild-web`; the connector is read-only, so
  Gasan renames it, turns off Vercel Authentication and pastes the env vars.
- Next: demo recordings, title films for the other nine, guest emails with the private
  link, then the live presenter.
- 2026-11-06: **live interview built** (switched on by `NEXT_PUBLIC_PRESENTER_URL`):
  - Hermes (`hermes-agent`, branch `claude/jasmin-presenter`): `interfaces/jasmin_presenter.py`
    runs the call on the companion video-call pipeline (her ElevenLabs voice, LemonSlice
    lip-sync avatar, voice activity, talk-over) at `/presenter/ws?invite=…`. It runs inside the
    Hermes process but sealed off: it loads no Hermes memory, persona, Telegram history or
    tools (a test checks the source), takes its instructions from the portfolio, and can only
    move the guest's page. Minutes are capped per invite across reconnects; two calls at once.
  - Portfolio: `/api/presenter/prompt` (her instructions for an approved guest) and
    `/api/presenter/report` (transcript saved with the chats, reviewed, summary to Telegram),
    both behind the shared secret; `LiveInterview` (site-wide, so the call survives page
    moves; corner window while she shows pages) and the room's Start button.
  - Tested end to end locally with the real presenter code and model: greeting, page moves,
    price boundary, overview of all ten, goodbye and `[[end]]`, time limit, phone layout.
    Transcription and voice were stand-ins (no OpenAI/ElevenLabs keys in the sandbox).
  - To switch on: merge the Hermes branch, set `PRESENTER_SECRET` (= `INTERVIEW_SECRET`) and
    `PORTFOLIO_URL` in Hermes's `.env`, then set `NEXT_PUBLIC_PRESENTER_URL` (Hermes's public
    https address) in Vercel and redeploy. Until then the site says the live room isn't open.

## 1. What we are building

Two things that share one engine:

1. **The portfolio**: a multi-page, cinematic website. Every project gets its own chapter
   with a short film, an animated "how it works", a real demo, the numbers, and links.
2. **Jasmin, AI Chief of Staff**: she greets visitors on the home page and gives a guided
   tour. Approved guests get a **live video call** with her. She talks with live lip-sync
   and drives the screen while she talks: her video shrinks into a corner frame and the page
   moves to the project she is explaining.

The key design idea is one **Stage engine** with two drivers:

| Mode | Who drives the page | Cost per visitor |
|---|---|---|
| Normal (public) | A scripted timeline: pre-rendered Jasmin clips plus page actions | ~0 (static video on a CDN) |
| Live interview (approved only) | Jasmin herself, through UI-only tool calls during the call | Per minute, capped per invite |

Both modes use the same actions (`show_project`, `go_to_section`, `play_demo`,
`highlight`, `back_to_overview`), so the guided tour and the live call look and feel the
same. The difference is that in live mode she can answer any question.

## 2. Site map

| Route | What it is |
|---|---|
| `/` | Opening film, Jasmin greets in her office, three doors: *Guided tour*, *Explore*, *Request a live interview* |
| `/work` | All projects as a cinematic gallery (film-poster cards, grouped: AI agents & voice / Platforms / Games & 3D) |
| `/work/[slug]` | One chapter per project (template below) |
| `/capabilities` | What Gasan can build for you, and how he builds (multi-agent AI workflow, handoff docs, tests, CI) |
| `/jasmin` | Meet Jasmin + the interview request form |
| `/interview/[token]` | The live call room (only with an approved, signed link) |
| `/admin` | Requests, approvals, call history and transcripts (backup to Telegram) |

### Project chapter template

1. **Title film**: 8 to 15 s loop made on fal, with the project name.
2. **The problem**: one sentence.
3. **How it works**: an animated diagram that plays as you scroll (3 to 5 steps).
4. **See it working**: a screen recording, a playable embed (NEONRUN), or the live site in a frame.
5. **Under the hood**: stack, plus counters for the numbers (tests, tools, models, speed).
6. **Hard problems I solved**: 2 or 3 short stories. Employers care most about this part.
7. **Status and links**: Live / Beta / In development / Concept, shown honestly.

Every chapter has Jasmin's voice-over with subtitles. Sound is off by default, with one tap to turn it on.

## 3. The projects (compressed from the repos)

Draft wording below. Gasan approves each one before media is made. Numbers marked (v) were
read from the repo; numbers marked (check) still need confirming.

| # | Project | One line | Proof points | Link |
|---|---|---|---|---|
| 1 | **Hermes + Jasmin** | Personal operator agent: Telegram, phone calls, email, calendar, website factory, media studio, and she improves herself | ~65 tools (v); self-improvement pipeline research → build → grade → deploy (v); `/update` self-update with rollback (v); phone calls via Twilio + realtime voice (v); live video calls with lip-sync avatar (v); ~67k lines Python, 75 test files (check) | No link (private), video showcase only |
| 2 | **Dentalscaner** | Free marketplace connecting UK patients with Turkish dental clinics: compare, chat directly (auto-translated), book | Django ASGI + Next.js + CRM app (v); free for patients (v); 7 languages, SLA reminders, translated chat (v) | dentalscaner.co.uk |
| 3 | **ModelPort** | One OpenAI-compatible API for 50+ models + a creative Studio + a terminal coding agent + **ModelPort IDE** with a live voice agent that controls the computer | v1.0.63 (v); 487 desktop tests passing (v); Windows native cursor control, browser control, approvals, emergency stop (v) | modelport.tech |
| 4 | **AI Movie Director** | Branded site on a real-time world model: users direct a live AI movie streamed over WebRTC, billed per second | Per-second metering through a 5 s heartbeat that is also the kill switch (v); Stripe top-ups; AI Director agent (v) | (need URL) |
| 5 | **Hivemind** | Multi-agent decision intelligence: AI personas debate a decision, check evidence, and produce an analyst report | OASIS multi-agent sim, pgvector memory, live web evidence with source tiers T1 to T4, belief-drift chart, PDF memo (v) | hivemind-beryl.vercel.app |
| 6 | **Voice Receptionist OS** | Multi-tenant AI phone receptionist: crawls a business website, builds a cited profile, answers its calls | Twilio + realtime speech-to-speech (v); shared trial number with codes (v); default-deny tools capped at 12 s (v); untrusted-data prompt envelope (v) | receptionist-os-portal.vercel.app |
| 7 | **Freight Order Agent (VIA)** | Reads a transport order (email + PDF), structures it, routes it for a truck, checks rules, drafts the driver instruction; the dispatcher approves | Built on a real Latvian operator's documents (v); one dispatcher goes from 15–20 trucks to 30–40 (v); "walk me through 18 stops" went from 40.7 s to 4.9 s in production (v) | freight-order-agent.vercel.app |
| 8 | **Brightpath** | Calm homeschool workspace: curriculum in the database, AI as a bounded tutor | Parent / student / teacher roles with RLS (v); deterministic mastery and revision rules (v); Oak / open curriculum imports (v); voice tutor studio (v) | homeschoolsystem.vercel.app |
| 9 | **NEON RUN** | Cyberpunk courier driving game in the browser | three.js + Rapier physics, 12 story missions, 4 districts, 8 drivable cars, on-foot mode, police (v); all assets AI-generated with fal / Meshy / Tripo / ElevenLabs (v) | neonrun-nine.vercel.app (**playable on the page**) |
| 10 | **Hollow Hull** | Survival-horror concept in Unreal Engine 5, entirely script-generated | Procedural Blender kit → Unreal level by script (v); fal textures and 3D models (v); Claude (cloud) + Codex (PC) build loop (v) | Concept: Blender renders + gameplay capture |

## 4. Media production (fal)

- **Jasmin, new look.** Start from her reference portrait so her face stays the same.
  Business wardrobe (tailored blazer, silk blouse, minimal jewellery). A corner office high
  up in a modern skyscraper: floor-to-ceiling glass, city skyline at dusk, warm key light.
  Output: an office still for the live avatar, plus professional listening and talking clips
  (neutral, warm, thinking, explaining with gestures, pointing to screen) and a professional
  gesture set (welcome, "let me show you", nod, thank you). No companion or flirty moods.
- **Greeting and tour narration**: written scripts, voiced in Jasmin's own cloned
  ElevenLabs voice (the same voice as the live call), lip-synced on fal onto the office
  footage. Pre-rendered, so a visitor costs nothing.
- **Project title films**: one per project, in its own visual style, using the best current
  image-to-video model on fal at build time. Image first, then animate, then grade, so the
  look stays consistent.
- **Subtitles**: WebVTT, made from our own scripts with timings aligned by Whisper.
- **Screen recordings**: scripted Playwright walkthroughs of the live web apps (1080p),
  edited to the narration. Gasan records two himself: the ModelPort IDE voice agent on
  Windows, and Hollow Hull in Unreal. I provide a shot list.
- Video hosting: Vercel Blob or Mux, with posters, lazy loading and mobile-sized versions.

## 5. Live interview flow

```
Guest fills the form on /jasmin  (name, company, role, email, topics, preferred time; Turnstile)
        │
        ▼
Request saved (Postgres) ──► Telegram to Gasan: [Approve 20 min] [Approve 30 min] [Decline]
        │                                     (+ /admin page as backup)
        ▼ approve
Signed one-time link (HMAC, bound to the guest, valid for a time window, minute cap)
emailed to the guest
        │
        ▼
/interview/[token] ──► LiveKit room
        ├── Jasmin agent: realtime voice (her voice) + portfolio knowledge + UI-only tools
        ├── LemonSlice avatar: her office still, lip-synced live
        └── Page: picture-in-picture Jasmin + the Stage engine runs her tool calls
        │
        ▼
After the call: transcript + summary to Gasan on Telegram
("Anna, Acme Capital, asked about Dentalscaner unit economics, wants a follow-up")
```

### What is reused from Hermes and what is new

Reused (ported, not linked): the LemonSlice ↔ LiveKit avatar protocol
(`interfaces/jasmin_avatar.py`), the realtime voice bridge, signed expiring links
(`jasmin_call.issue_token`), mood-clip fallback if the avatar fails, the room/clip pipeline
on fal (`tools/jasmin_room.py`).

New: a **separate presenter service** (a LiveKit Agents worker) with:

- a **professional persona**, with **no** access to companion memory, Telegram history,
  personal facts, email, shell or any Hermes tool;
- knowledge = the approved project dossiers + an approved "about Gasan as a developer"
  brief + FAQ (fits in context with prompt caching, so no RAG is needed and answers stay consistent);
- tools that only move the screen: `show_project`, `go_to_section`, `play_demo`,
  `show_architecture`, `open_live_site`, `highlight`, `back_to_overview`, `end_call`;
- page → agent context events ("guest is looking at Hivemind"), so she can react to what they click;
- rules: says she is an AI at the start, never commits Gasan to prices or deadlines, says so
  when a project is still in testing, and logs follow-ups for Gasan.

Why separate from Hermes: Hermes holds Gasan's email, phone, shell and private memory.
Strangers must never reach that process. Keeping the investor-facing agent separate is
also a good security story to tell employers.

### Cost controls

Approval required; one-time link; per-invite minute cap (auto goodbye at the limit); one
live call at a time; a monthly budget ceiling; rate-limited request form. The real per-minute
cost (voice + avatar) is measured on the first test call and the caps are set from that.

## 6. Tech stack

- **Site**: Next.js (App Router) + TypeScript, Tailwind, GSAP ScrollTrigger + Lenis
  smooth scroll, Framer Motion / View Transitions for page changes, React Three Fiber for
  the 3D opening scene. `prefers-reduced-motion` and mobile fallbacks throughout.
- **Content**: one dossier file per project in `content/`. It is the single source for the
  pages **and** for Jasmin's knowledge, so the site and Jasmin never disagree.
- **Data**: Postgres (Neon) for requests, invites, call logs.
- **Live**: LiveKit (rooms + agent), the realtime voice model Jasmin uses today, LemonSlice avatar.
- **Hosting**: site on Vercel; presenter worker on the VPS as its own systemd service
  (or LiveKit Cloud agent hosting).
- **Repo layout**: `web/` (site), `presenter/` (live agent), `content/` (dossiers), `media/` (generation scripts + prompts manifest).

## 7. Build order

| Phase | Deliverable | Gasan reviews |
|---|---|---|
| 0 | Project dossiers + Jasmin's professional persona + "about Gasan" brief | Wording and facts |
| 1 | Design system + home page + **one flagship chapter fully finished** (style benchmark) | The look, before we copy it 9 times |
| 2 | Jasmin's new office look (still + clips), voice-overs, title films | Her look and voice |
| 3 | All 10 chapters + `/work` + `/capabilities` + guided tour (scripted Stage) | Full public site |
| 4 | Interview request → Telegram approval → signed link → email | Approve a test request |
| 5 | Live presenter: avatar call + screen control + post-call summary | Rehearsal calls |
| 6 | Polish: speed, mobile, analytics, domain, final QA | Launch |

## 8. What is needed from Gasan

1. Jasmin's reference portrait file (`/srv/hermes/memory/jasmin/reference.*` on the server).
2. Her ElevenLabs voice ID, plus a way to use it from here (an ElevenLabs key saved to this
   environment, or voice-overs rendered by Hermes).
3. Answers to the open decisions (see chat): public chat, approval channel, her title, domain, where the agent runs.
4. The MovieDirector live URL, and confirmation which projects may be shown publicly.
5. A short "about me" for Jasmin: background, what you want to be hired for, availability,
   what she must not discuss.
6. Network access for this environment to your live sites when we start recording demos
   (an approval prompt will ask).
