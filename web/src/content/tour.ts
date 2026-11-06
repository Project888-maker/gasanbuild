// The guided tour: what Jasmin says and where the page goes while she says it.
// Captions now; each line gets her recorded voice and lip-synced clip later.

import type { StageAction } from "@/lib/stage";

export type TourStep = { say: string; actions: StageAction[] };

export const tour: TourStep[] = [
  {
    say: "Hi, I'm Jasmin, Gasan's AI Chief of Staff. Let me walk you through what he has built this year. You can pause or skip at any time.",
    actions: [{ type: "go_home" }],
  },
  {
    say: "I'll start with the project I know best, because I'm part of it. This is Hermes, Gasan's autonomous operator agent.",
    actions: [{ type: "show_project", slug: "hermes" }],
  },
  {
    say: "She works through Telegram, phone calls and live video, with more than sixty tools: email, calendar, websites, media, and his businesses.",
    actions: [{ type: "highlight", id: "doors" }],
  },
  {
    say: "The part employers ask about most: when she lacks a skill, she builds it, tests it with real assertions and deploys it herself, with automatic rollback.",
    actions: [{ type: "highlight", id: "loop" }],
  },
  {
    say: "Next, Dentalscaner: a free marketplace where UK patients compare Turkish dental clinics and chat with them directly, translated both ways.",
    actions: [{ type: "show_project", slug: "dentalscaner" }],
  },
  {
    say: "ModelPort is one API for more than fifty AI models, plus an IDE with a live voice agent that operates the computer: browser, apps and the real mouse pointer.",
    actions: [{ type: "show_project", slug: "modelport" }],
  },
  {
    say: "Freight Order Agent turns an order email and PDF into a routed, risk-checked job, so one dispatcher can run twice as many trucks. A human approves every send.",
    actions: [{ type: "show_project", slug: "freight" }],
  },
  {
    say: "And he builds games too. NEON RUN is a cyberpunk driving game that runs in your browser. Every asset in it was made with AI. You can play it.",
    actions: [{ type: "show_project", slug: "neonrun" }],
  },
  {
    say: "That's the highlights. All ten projects are here. If you'd like to talk to me live on video, request an interview, and Gasan will review it personally.",
    actions: [{ type: "back_to_overview" }],
  },
];
