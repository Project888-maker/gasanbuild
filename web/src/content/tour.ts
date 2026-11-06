// The guided tour: what Jasmin says and where the page goes while she says it.
// It covers all ten projects, in the same order as the site.
// Each step's `id` names its recording in media/voice-lines.json (same words), its
// voice file /media/voice/<id>.mp3 and its lip-synced clip /media/talk/<id>.mp4.
// Media is cached for a year, so a changed line gets a new id, never a reused one.

import type { StageAction } from "@/lib/stage";

type Step = { id: string; say: string; actions: StageAction[] };
export type TourStep = Step & { audio: string; clip: string };

const steps: Step[] = [
  {
    id: "tour-01",
    say: "Hi, I'm Jasmin, Gasan's AI Chief of Staff. Let me walk you through what he has built this year. You can pause or skip at any time.",
    actions: [{ type: "go_home" }],
  },
  {
    id: "tour-02",
    say: "I'll start with the project I know best, because I'm part of it. This is Hermes, Gasan's autonomous operator agent.",
    actions: [{ type: "show_project", slug: "hermes" }],
  },
  {
    id: "tour-03",
    say: "She works through Telegram, phone calls and live video, with more than sixty tools: email, calendar, websites, media, and his businesses.",
    actions: [{ type: "highlight", id: "doors" }],
  },
  {
    id: "tour-04",
    say: "The part employers ask about most: when she lacks a skill, she builds it, tests it with real assertions and deploys it herself, with automatic rollback.",
    actions: [{ type: "highlight", id: "loop" }],
  },
  {
    id: "tour-05",
    say: "Next, Dentalscaner: a free marketplace where UK patients compare Turkish dental clinics and chat with them directly, translated both ways.",
    actions: [{ type: "show_project", slug: "dentalscaner" }],
  },
  {
    id: "tour-06",
    say: "ModelPort is one API for more than fifty AI models, plus an IDE with a live voice agent that operates the computer: browser, apps and the real mouse pointer.",
    actions: [{ type: "show_project", slug: "modelport" }],
  },
  {
    id: "tour-10",
    say: "AI Movie Director lets anyone direct a live AI film in the browser. It streams in real time, the story changes as you speak, and every second is metered and billed.",
    actions: [{ type: "show_project", slug: "moviedirector" }],
  },
  {
    id: "tour-11",
    say: "Hivemind puts a room of AI experts on your decision. They debate it in rounds, check evidence from the live web, and hand you an analyst-grade report.",
    actions: [{ type: "show_project", slug: "hivemind" }],
  },
  {
    id: "tour-12",
    say: "Receptionist OS gives any business its own AI phone receptionist, built from its website, with safety rules no caller can talk it out of.",
    actions: [{ type: "show_project", slug: "receptionist" }],
  },
  {
    id: "tour-07",
    say: "Freight Order Agent turns an order email and PDF into a routed, risk-checked job, so one dispatcher can run twice as many trucks. A human approves every send.",
    actions: [{ type: "show_project", slug: "freight" }],
  },
  {
    id: "tour-13",
    say: "Brightpath is a calm homeschool workspace. The curriculum is real and kept in the database, and the AI is a tutor that only teaches from reviewed material.",
    actions: [{ type: "show_project", slug: "brightpath" }],
  },
  {
    id: "tour-08",
    say: "And he builds games too. NEON RUN is a cyberpunk driving game that runs in your browser. Every asset in it was made with AI. You can play it.",
    actions: [{ type: "show_project", slug: "neonrun" }],
  },
  {
    id: "tour-14",
    say: "Hollow Hull goes further: a survival-horror level in Unreal Engine 5, built entirely from scripts, with AI-made textures and props. Nothing was placed by hand.",
    actions: [{ type: "show_project", slug: "hollow-hull" }],
  },
  {
    id: "tour-15",
    say: "That's all ten. If you'd like to talk to me live on video, or to Gasan himself, just ask me in the chat, and Gasan will review it personally.",
    actions: [{ type: "back_to_overview" }],
  },
];

export const tour: TourStep[] = steps.map((step) => ({
  ...step,
  audio: `/media/voice/${step.id}.mp3`,
  clip: `/media/talk/${step.id}.mp4`,
}));
