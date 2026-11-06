// The project dossiers: one source for the pages and for Jasmin's knowledge.
// Facts were read from each repository. Keep them true: Jasmin repeats them to
// investors and employers, and they will check.

export type Status = "live" | "beta" | "pilot" | "private" | "playable" | "concept";

export type Project = {
  slug: string;
  title: string;
  kicker: string;
  tagline: string;
  problem: string;
  summary: string;
  group: "agents" | "platforms" | "games";
  status: Status;
  statusNote: string;
  accent: string;
  poster: string;
  film?: string;
  steps: { title: string; text: string }[];
  stats: { value: string; label: string }[];
  hardProblems: { title: string; text: string }[];
  stack: string[];
  links: { label: string; href: string }[];
  gallery?: { src: string; caption: string }[];
};

export const STATUS_LABEL: Record<Status, string> = {
  live: "Live",
  beta: "Beta",
  pilot: "Pilot",
  private: "Private · shown by demo",
  playable: "Playable",
  concept: "Concept · in development",
};

export const GROUPS: Record<Project["group"], string> = {
  agents: "AI agents & voice",
  platforms: "Platforms",
  games: "Games & 3D",
};

export const projects: Project[] = [
  {
    slug: "hermes",
    title: "Hermes",
    kicker: "Autonomous operator agent",
    tagline: "An AI operator that runs my day, and builds her own new skills.",
    problem:
      "A founder running several businesses needs one assistant that can actually act: call, email, plan, build and publish, safely.",
    summary:
      "Hermes is my personal operator agent. She lives in Telegram and on the phone, works across email, calendar, social media and my businesses, builds and deploys websites, and produces images and video. When she lacks a skill, she researches it, writes it, tests it and deploys it herself. Jasmin is her face and voice: live video calls with real-time lip-sync. Jasmin is also the AI Chief of Staff greeting you on this site.",
    group: "agents",
    status: "private",
    statusNote: "Runs in production on my server every day. Private, so it is shown here by demo.",
    accent: "#E8B86B",
    poster: "/media/hermes.jpg",
    film: "/media/hermes.mp4",
    steps: [
      {
        title: "One brain, many doors",
        text: "Telegram, phone calls (Twilio with real-time speech) and browser video calls all feed one agent loop with intent gates and 60+ tools.",
      },
      {
        title: "Memory that is earned",
        text: "Conversations, owner facts and a ledger of every phone call live in SQLite memory. Durable facts need evidence, not a guess.",
      },
      {
        title: "Acts, with guardrails",
        text: "Real-world actions (email, calls, website builds, publishing, business data) are only offered when the current message asks for them. Sensitive phone actions can require a spoken passphrase.",
      },
      {
        title: "Teaches herself",
        text: "Missing a skill? A pipeline researches it, builds it in an isolated clone, grades it with real tests and strict diff rules, then deploys it with health checks and automatic rollback.",
      },
      {
        title: "Ships websites",
        text: "Brief → blueprint → design system → build → Playwright and accessibility checks on three screen sizes → up to three repair rounds → my approval → an immutable release on Vercel.",
      },
    ],
    stats: [
      { value: "67k", label: "lines of Python" },
      { value: "941", label: "automated tests" },
      { value: "60+", label: "tools she can use" },
      { value: "3", label: "channels: chat, phone, video" },
    ],
    hardProblems: [
      {
        title: "Self-improvement without self-destruction",
        text: "A new skill passes only on real assertions and exit codes, never on an AI's opinion. A build may touch only its own module; voice, payments and auth are off-limits. Deploys hold a health and stability window and roll back on any failure.",
      },
      {
        title: "Updating a live agent from one chat message",
        text: "/update pulls the code, installs packages, compile-checks, waits for live phone calls to end, restarts, verifies health and rolls back if anything fails. It never overwrites files edited by hand on the server.",
      },
      {
        title: "A face that talks in real time",
        text: "Her voice streams into a LiveKit room where a LemonSlice avatar animates her photo with lip-sync. If the avatar fails, a fast model picks mood clips that follow the conversation, so the call goes on.",
      },
      {
        title: "Runs a business, not just a chat",
        text: "She checks Dentalscaner for patients waiting past a clinic's response time, nudges the clinic or phones the patient with a ready briefing, and logs every action for me.",
      },
    ],
    stack: [
      "Python 3.11", "FastAPI", "OpenRouter LLMs", "GPT-Live realtime voice", "Twilio Media Streams",
      "LiveKit", "LemonSlice avatar", "ElevenLabs", "fal.ai", "SQLite", "Playwright + axe", "Vercel API", "systemd on Ubuntu",
    ],
    links: [],
  },
  {
    slug: "dentalscaner",
    title: "Dentalscaner",
    kicker: "Dental tourism marketplace",
    tagline: "Compare Turkish dental clinics, talk to them in your own language, and book. Free for patients.",
    problem:
      "UK patients considering treatment in Turkey face middlemen, unclear prices and a language barrier.",
    summary:
      "Dentalscaner is a free marketplace that connects UK patients with dental clinics in Turkey. Patients compare clinics, treatments, prices, reviews and before-and-after photos, then chat with the clinic directly, with every message translated both ways, and send a booking request. Clinics get their own dashboard, notifications and response-time reminders.",
    group: "platforms",
    status: "live",
    statusNote: "Live with real clinics onboarded.",
    accent: "#5ED6C4",
    poster: "/media/dentalscaner.jpg",
    steps: [
      { title: "Discover", text: "Search clinics by city and treatment; compare prices, ratings, reviews and before-and-after photos." },
      { title: "Talk directly", text: "Real-time chat over WebSockets with automatic translation: the patient writes English, the clinic reads Turkish." },
      { title: "Book", text: "Structured quote and booking requests, with confirmation emails to the patient." },
      { title: "Keep clinics responsive", text: "Email and in-app notifications, reminders when a patient is left waiting, and alerts to the platform admin." },
      { title: "AI on top", text: "An AI assistant answers patients, and Hermes watches for waiting patients and calls them back." },
    ],
    stats: [
      { value: "7", label: "languages" },
      { value: "4", label: "portals + CRM" },
      { value: "£0", label: "cost to patients" },
      { value: "70k", label: "lines of code" },
    ],
    hardProblems: [
      { title: "Chat across languages", text: "Every message in the live chat is translated both ways, so a patient and a clinic never need a shared language." },
      { title: "Nobody left waiting", text: "Response-time timers on the backend nudge clinics by email and in-app, then escalate to the admin." },
      { title: "One platform, many businesses", text: "Separate patient, clinic-admin, platform-admin and affiliate portals, plus a CRM, all on one backend." },
    ],
    stack: ["Django (ASGI)", "Django Channels", "Celery + Redis", "Next.js App Router", "next-intl", "Cloudinary", "Nginx + Daphne on Ubuntu", "Vercel"],
    links: [{ label: "dentalscaner.co.uk", href: "https://dentalscaner.co.uk" }],
  },
  {
    slug: "modelport",
    title: "ModelPort",
    kicker: "AI gateway + voice-controlled IDE",
    tagline: "One API for 50+ AI models, and an IDE you talk to that operates your computer.",
    problem:
      "Developers juggle many AI providers, keys and bills, and coding agents cannot see or use the rest of the desktop.",
    summary:
      "ModelPort is an AI platform in four parts: an OpenAI-compatible gateway to 50+ models (switch models by changing one string), a Studio for video, image and voice generation, ModelPort Code (a terminal coding agent), and ModelPort IDE, a desktop app with a live voice agent. The voice agent sees the screen and controls the browser, apps and the real mouse pointer, with approvals and an emergency stop.",
    group: "agents",
    status: "live",
    statusNote: "Gateway and Studio live at modelport.tech. The IDE is in Windows beta testing.",
    accent: "#8B7CFF",
    poster: "/media/modelport.jpg",
    steps: [
      { title: "One endpoint", text: "An OpenAI-compatible /v1 API with keys, usage metering and top-ups, including crypto." },
      { title: "Studio", text: "Generate videos, images, product ads and voices with 50+ models; each result comes with a lesson on how it was made." },
      { title: "ModelPort Code", text: "A terminal coding agent with validated local tools, command approvals and recoverable checkpoints." },
      { title: "ModelPort IDE", text: "A desktop workbench where a live voice agent sees the screen, moves the real pointer to the right target, types and clicks. Consequential actions wait for approval." },
      { title: "Learns from real sessions", text: "An opt-in local recorder with a privacy pause captures voice sessions, so real failures can be found and fixed." },
    ],
    stats: [
      { value: "50+", label: "AI models, one API" },
      { value: "487", label: "desktop tests passing" },
      { value: "v1.0.63", label: "desktop release" },
      { value: "3", label: "OS in CI" },
    ],
    hardProblems: [
      { title: "An agent that does not lie about what it did", text: "Every action returns a receipt that separates 'I clicked' from 'it worked', so the voice never claims a result the screen does not show." },
      { title: "Long voice sessions", text: "The live connection renews itself at safe boundaries, carrying a compact transcript, recent receipts and the latest screenshot." },
      { title: "Safety on a real desktop", text: "Sandboxed renderer, approval cards for consequential actions, secure credential handoff, an always-visible emergency stop, and a privacy lock that pauses recording." },
    ],
    stack: ["Next.js", "TypeScript", "Drizzle + Postgres", "Electron", "Playwright", "Windows UI Automation", "Realtime voice", "Solana payments", "Vercel"],
    links: [{ label: "modelport.tech", href: "https://modelport.tech" }],
  },
  {
    slug: "moviedirector",
    title: "AI Movie Director",
    kicker: "Real-time AI cinema",
    tagline: "Direct a live AI movie in your browser. The story changes as you speak.",
    problem:
      "Real-time world models can stream video live, but they come with no business layer: accounts, per-second billing, safety.",
    summary:
      "AI Movie Director is a branded product on top of a real-time world model on fal. Users sign up, top up with Stripe, upload character references and direct a live film that streams back over WebRTC at 24 frames a second. Typed or spoken directions steer the story. An AI Director agent plans scenes and budgets, and a Create playground offers dozens of image, video and audio tools.",
    group: "platforms",
    status: "live",
    statusNote: "Live: sign up, top up and direct a film.",
    accent: "#FF6B5B",
    poster: "/media/moviedirector.jpg",
    steps: [
      { title: "Reserve", text: "The server checks the balance and opens a session at the chosen resolution." },
      { title: "Stream", text: "Video and audio flow peer to peer over WebRTC. The API key never leaves the server." },
      { title: "Meter", text: "Every 5-second heartbeat passes through my proxy. It charges the elapsed seconds and is also the kill switch at zero balance." },
      { title: "Direct", text: "Prompts, script beats, reference images and audio, spoken directions, and a recording to download." },
      { title: "Earn", text: "A configurable markup; the admin dashboard shows revenue, model cost and profit." },
    ],
    stats: [
      { value: "24", label: "frames per second, live" },
      { value: "5 s", label: "metering heartbeat" },
      { value: "per second", label: "billing" },
      { value: "30+", label: "creation tools" },
    ],
    hardProblems: [
      { title: "Billing a live stream", text: "Race-safe per-second debits. Credit is added only from signed Stripe webhooks, and repeated deliveries are ignored." },
      { title: "The proxy is the meter and the kill switch", text: "Because every heartbeat goes through the server, a user who runs out of credit is cut off within seconds." },
      { title: "An AI Director that asks first", text: "The Director agent plans shots and budgets, and spending actions wait for the user's approval." },
    ],
    stack: ["Next.js", "Prisma + Postgres", "Stripe", "fal realtime (WebRTC)", "Claude (Director agent)", "Vercel"],
    links: [{ label: "aimoviedirector.vercel.app", href: "https://aimoviedirector.vercel.app/director" }],
  },
  {
    slug: "hivemind",
    title: "Hivemind",
    kicker: "Multi-agent decision intelligence",
    tagline: "Before you commit to a big decision, let a room of AI experts argue it out.",
    problem: "High-stakes decisions are usually made on one opinion and a slide deck, with nobody stress-testing them.",
    summary:
      "Upload a seed document, define the options, and Hivemind generates expert personas with distinct roles, biases and stakes. They debate across structured rounds and search the live web for evidence, and every claim is tracked and scored. The result is an analyst-grade decision report with a primary strategy, a fallback and the options it eliminated.",
    group: "agents",
    status: "live",
    statusNote: "Deployed; used for real investment and strategy questions.",
    accent: "#56C8FF",
    poster: "/media/hivemind.jpg",
    steps: [
      { title: "Seed", text: "The document is broken into entities, topics and searchable chunks." },
      { title: "Personas", text: "Experts with roles, biases and stakes are generated, with a fallback model if the first one fails." },
      { title: "Debate", text: "A multi-agent simulation runs structured rounds; each agent has its own vector memory and can search the live web." },
      { title: "Evidence ledger", text: "Claims are checked against the seed document, and sources are scored in quality tiers T1 to T4." },
      { title: "Decision report", text: "A judge resolves the debate. You get a belief timeline, a full PDF report, a one-page memo, and you can chat with any agent afterwards." },
    ],
    stats: [
      { value: "T1–T4", label: "source quality tiers" },
      { value: "live", label: "web evidence, cited" },
      { value: "2", label: "PDF formats" },
      { value: "1", label: "chat per agent, after" },
    ],
    hardProblems: [
      { title: "Stopping AI from agreeing with itself", text: "Personas carry different stakes and biases, and conviction drift is tracked round by round, so consensus has to be earned." },
      { title: "Evidence over eloquence", text: "Each claim is verified against the seed and tiered by source quality before it can move the decision." },
      { title: "Guards on the report", text: "Tests make sure the primary strategy is never among the eliminated options and that the fallback really differs from it." },
    ],
    stack: ["FastAPI", "Celery + Redis", "PostgreSQL + pgvector", "OASIS multi-agent", "Gemini", "Claude", "Serper search", "Next.js", "D3", "Playwright PDF"],
    links: [{ label: "hivemind-beryl.vercel.app", href: "https://hivemind-beryl.vercel.app" }],
  },
  {
    slug: "receptionist",
    title: "Receptionist OS",
    kicker: "AI phone receptionist platform",
    tagline: "Give any business its own AI receptionist, built from its website.",
    problem: "Small businesses miss calls, and a human receptionist for every one of them is expensive.",
    summary:
      "A multi-tenant service where each business gets an AI receptionist on its phone line. It crawls the business's website into a structured, source-cited profile, builds a safe prompt from verified facts only, and answers calls with real-time speech-to-speech. A prospect can try it immediately on a shared trial number with a code.",
    group: "agents",
    status: "beta",
    statusNote: "Running with a demo number; onboarding portal live.",
    accent: "#3DDC97",
    poster: "/media/receptionist.jpg",
    steps: [
      { title: "Crawl", text: "The website becomes a universal profile, with a source URL and confidence for every fact, plus a list of gaps." },
      { title: "Assemble", text: "The prompt is built from present, validated facts only, inside a labelled untrusted-data envelope." },
      { title: "Answer", text: "Twilio Media Streams to realtime speech-to-speech, with barge-in and safe tool calls." },
      { title: "Try it", text: "A shared trial number with spoken or keypad codes, caps and metering." },
      { title: "Go live", text: "Consent-based activation, a number from an owned pool, call-forwarding guidance; messages and booking requests go to a human to confirm." },
    ],
    stats: [
      { value: "12 s", label: "hard cap per tool call" },
      { value: "0", label: "phone numbers in logs" },
      { value: "1", label: "codebase, any industry" },
      { value: "default-deny", label: "tool policy" },
    ],
    hardProblems: [
      { title: "A website cannot hijack the agent", text: "Website text never enters the voice prompt directly: it is extracted under a strict schema, and instruction-like strings are neutralised." },
      { title: "Business type is data, not code", text: "Industries are editable database rows. There are no per-industry modules or branches." },
      { title: "Privacy by design", text: "Every tenant query carries the tenant ID, routing tokens are signed and short-lived, and rate limits use keyed hashes." },
    ],
    stack: ["Python 3.12", "FastAPI", "PostgreSQL 16", "Alembic", "Twilio", "Realtime speech-to-speech", "Next.js portal"],
    links: [{ label: "receptionist-os-portal.vercel.app", href: "https://receptionist-os-portal.vercel.app" }],
  },
  {
    slug: "freight",
    title: "Freight Order Agent",
    kicker: "AI for road-freight dispatch",
    tagline: "From an order email and PDF to a routed, risk-checked job in under 30 seconds.",
    problem:
      "European dispatchers retype every order from email and PDF, write driver instructions by hand and check routes in Google Maps.",
    summary:
      "Freight Order Agent reads a transport order, structures it, routes it on a truck profile with real truck kilometres, flags missing information and operational or legal risks, and drafts the driver instruction. VIA, its AI assistant, answers questions about any tour. Nothing is sent or written anywhere without the dispatcher's click. It lets one dispatcher handle 30–40 trucks instead of 15–20.",
    group: "agents",
    status: "pilot",
    statusNote: "Built on a real Latvian operator's documents and tested with him.",
    accent: "#FFB547",
    poster: "/media/freight.jpg",
    steps: [
      { title: "Read", text: "Email and PDF are extracted into a structured order: stops, cargo, references." },
      { title: "Reconcile", text: "Information in the email that is not in the PDF (ferry booking, customs, border crossing) is detected and merged." },
      { title: "Route", text: "Truck-profile routing gives real truck kilometres and the mileage discrepancy." },
      { title: "Check", text: "Rules flag missing information and operational or legal risks." },
      { title: "Approve and send", text: "The dispatcher approves; the driver instruction goes to Telegram and the TMS write is audited." },
    ],
    stats: [
      { value: "2×", label: "trucks per dispatcher" },
      { value: "40.7 → 4.9 s", label: "an 18-stop briefing, in production" },
      { value: "< 30 s", label: "order to ready job" },
      { value: "0", label: "sends without a human click" },
    ],
    hardProblems: [
      { title: "Diagnosed from its own logs", text: "Production was slow and falling back to templates. The logs showed rate limits caused by tool-schema overhead. Briefing the open tour up front made the common case need zero tool calls." },
      { title: "The human stays in control", text: "Every external action (Telegram sends, TMS writes, approvals, route saves) has a dispatcher gate." },
      { title: "Memory that is reviewed", text: "VIA learns from corrections only after approval, and it never rewrites its own code, prompts or policy." },
    ],
    stack: ["Next.js", "TypeScript", "Supabase (Postgres, RLS, storage)", "LLM extraction", "OpenRouteService", "Telegram Bot API", "Vercel"],
    links: [{ label: "freight-order-agent.vercel.app", href: "https://freight-order-agent.vercel.app" }],
  },
  {
    slug: "brightpath",
    title: "Brightpath",
    kicker: "AI homeschool workspace",
    tagline: "A calm home-learning space where the curriculum is real and the AI is a tutor, not the teacher.",
    problem: "Homeschooling families stitch together curricula, worksheets and AI chat that makes things up.",
    summary:
      "Brightpath gives a parent and a student one workspace: curriculum, lessons, practice, revision and a shared calendar, with optional teacher access that the parent approves. The curriculum and the student's evidence live in the database, deterministic rules calculate mastery and revision, and the AI explains and generates practice only from reviewed material.",
    group: "platforms",
    status: "beta",
    statusNote: "Foundation complete and deployed; family testing.",
    accent: "#F4A6C0",
    poster: "/media/brightpath.jpg",
    steps: [
      { title: "Onboard", text: "The parent creates a student; curriculum, subjects and weekly availability are saved together." },
      { title: "Learn", text: "Browse subjects and topics, imported lessons from open curricula, and practice quizzes." },
      { title: "Tutor", text: "The AI explains and creates questions only from reviewed material." },
      { title: "Track", text: "Mastery, mistakes and spaced revision are calculated by deterministic rules." },
      { title: "Together", text: "A shared calendar, live sessions, invitations and teacher review." },
    ],
    stats: [
      { value: "3", label: "roles: parent, student, teacher" },
      { value: "RLS", label: "on every table" },
      { value: "0", label: "answers invented by AI" },
      { value: "open", label: "curriculum imports" },
    ],
    hardProblems: [
      { title: "AI with boundaries", text: "The AI never invents the curriculum, calculates mastery, grants permissions or writes answer keys." },
      { title: "Family privacy", text: "Row-level security everywhere; invitations are single-use and expire after seven days." },
    ],
    stack: ["Next.js", "TypeScript", "Tailwind v4", "Supabase", "LLM tutor API", "WebRTC"],
    links: [{ label: "homeschoolsystem.vercel.app", href: "https://homeschoolsystem.vercel.app" }],
  },
  {
    slug: "neonrun",
    title: "NEON RUN",
    kicker: "Browser game · three.js",
    tagline: "A rain-soaked cyberpunk courier game that runs in your browser. Every asset is made with AI.",
    problem: "Can one builder with AI tools ship a console-style driving game that runs in a browser tab?",
    summary:
      "Night-time courier driving in a neon megacity: a 12-mission story or free-ride deliveries, drifting, traffic, hazard drones and police. Buy and upgrade cars, unlock four districts, get out and walk the streets, talk to people, or take a car. Everything (the city, brands, signs, cars, people, music and voices) was generated or modelled for this project.",
    group: "games",
    status: "playable",
    statusNote: "Playable now on desktop, phone and gamepad.",
    accent: "#FF3DF2",
    poster: "/media/neonrun.jpg",
    steps: [
      { title: "Engine", text: "three.js on WebGL2 with Vite and TypeScript." },
      { title: "Physics", text: "Rapier physics with a custom four-wheel raycast vehicle: suspension, slip-angle tyres, handbrake drifts." },
      { title: "Rendering", text: "Wet-road reflections, neon light pools, bloom, ambient occlusion, GPU rain and lens rain." },
      { title: "World", text: "An instanced procedural city in four districts, with traffic, police pursuit and an on-foot mode with voiced conversations." },
      { title: "AI assets", text: "fal for textures, signs, music and voices; image-to-3D cars and people; Blender cleanup. Every file's prompt, model, seed and cost is in a manifest." },
    ],
    stats: [
      { value: "12", label: "story missions" },
      { value: "4", label: "districts" },
      { value: "8", label: "drivable cars" },
      { value: "100%", label: "original AI-made assets" },
    ],
    hardProblems: [
      { title: "Console-feel physics in a browser", text: "A custom raycast vehicle on Rapier, with drift assists, ABS and adaptive graphics quality that downgrades itself to hold the frame rate." },
      { title: "An asset pipeline you can audit", text: "Every generated file is traceable to its prompt, model, seed and cost." },
    ],
    stack: ["three.js", "WebGL2", "Rapier (WASM)", "Vite", "TypeScript", "Blender (bpy)", "fal.ai", "Meshy / Tripo 3D", "ElevenLabs"],
    links: [{ label: "Play NEON RUN", href: "https://neonrun-nine.vercel.app" }],
    gallery: [
      { src: "/media/neonrun-drive.jpg", caption: "Neon District, 116 km/h in the rain" },
      { src: "/media/neonrun-drift.jpg", caption: "Drifting through the Backstreets" },
      { src: "/media/neonrun-skyline.jpg", caption: "Far camera over the skyline" },
    ],
  },
  {
    slug: "hollow-hull",
    title: "Hollow Hull",
    kicker: "Unreal Engine 5 · horror concept",
    tagline: "A survival-horror level on a cursed 1900s steamship, generated entirely from scripts.",
    problem: "Can a whole game level be built, lit and furnished by code and AI, with nothing placed by hand?",
    summary:
      "Hollow Hull is a third-person survival-horror concept with its own story and art: one flooded deck of a cursed steamship, and The Hollow, a living cave beneath the ice. Blender scripts build the kit, a text grid becomes the level, and an Unreal script imports everything, makes the materials and builds the map. AI generates the textures and the 3D props.",
    group: "games",
    status: "concept",
    statusNote: "Two levels building in Unreal Engine 5.7; combat in progress.",
    accent: "#E0483E",
    poster: "/media/hollow-hull.jpg",
    steps: [
      { title: "Kit", text: "Every piece (walls, stairs, boiler, ribs, the heart) is built procedurally in Blender, with collision." },
      { title: "Layout", text: "Text grid maps become exact placements for each level." },
      { title: "Materials", text: "fal pictures become seamless PBR maps with bump and shine." },
      { title: "Props", text: "fal concept art goes to image-to-3D and is fitted in Blender." },
      { title: "Unreal", text: "Scripts build the levels, combat, sound, world events and graphics presets." },
    ],
    stats: [
      { value: "2", label: "levels" },
      { value: "0", label: "objects placed by hand" },
      { value: "UE 5.7", label: "engine" },
      { value: "3", label: "agents in the loop" },
    ],
    hardProblems: [
      { title: "Scripts are the source of truth", text: "Any change is made in a script and re-run, so the whole level can be rebuilt from scratch at any time." },
      { title: "A three-way build loop", text: "Claude in the cloud writes scripts and assets, Codex on my PC runs Blender and Unreal, and I play and give feedback." },
    ],
    stack: ["Unreal Engine 5.7", "Python (Unreal + bpy)", "Blender", "fal.ai textures and 3D", "Hunyuan3D"],
    links: [],
    gallery: [
      { src: "/media/hollow-hull-heart.jpg", caption: "The Hollow: the heart chamber (Blender preview)" },
      { src: "/media/hollow-hull-engine.jpg", caption: "Engine room of the flooded deck" },
      { src: "/media/hollow-hull-ribs.jpg", caption: "The rib tunnel" },
    ],
  },
];

export const bySlug = (slug: string) => projects.find((p) => p.slug === slug);
