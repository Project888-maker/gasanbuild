// Gasan's creator story, from what he told us (Hermes's story bank, 2026-09-20).
// Off limits on this site and for Jasmin: his health, his family, his income.

export type Chapter = { place: string; title: string; text: string; image: string };

export const chapters: Chapter[] = [
  {
    place: "Latvia",
    title: "The first plan",
    text: "I was a professional judo athlete, a multiple-time Latvian national champion training for the Olympics. Judo was the whole plan. It didn't happen, and there was no second one.",
    image: "/media/story-judo.jpg",
  },
  {
    place: "London",
    title: "The stage",
    text: "I moved to London and took up bodybuilding. I made it onto the Arnold Classic stage and placed low because I chose the wrong category. The preparation was right; one decision was wrong.",
    image: "/media/story-stage.jpg",
  },
  {
    place: "China",
    title: "Ten thousand people",
    text: "For a year I was a brand spokesperson in China, speaking on stage to audiences of 2,000 to 10,000 people with no experience at all. I had no choice, so I did it, and I loved it.",
    image: "/media/story-china.jpg",
  },
  {
    place: "London",
    title: "Good money, no meaning",
    text: "Back in London I grew a delivery business from just me to 8 vans and 8–10 drivers. The money was good, but there was nothing meaningful to achieve in it. I walked away.",
    image: "/media/story-fleet.jpg",
  },
  {
    place: "Turkey · April 2025",
    title: "The idea",
    text: "Getting dental treatment in Turkey, choosing a clinic meant endless WhatsApp threads with agents. I wanted one platform for treatment abroad, like Skyscanner. That became Dentalscaner.",
    image: "/media/story-turkey.jpg",
  },
  {
    place: "Now",
    title: "Learning to build",
    text: "I paid outsourced developers for seven months. One bug took them a week. So I learned to build, let them go and rebuilt Dentalscaner myself, better. Then came Hermes, Hivemind, Receptionist OS and the rest.",
    image: "/media/story-build.jpg",
  },
];

export const WHY =
  "I'm in AI because I can feel how it can change people's lives for the good, and I want to be part of it.";

export const POSITIONS = [
  "There's a third camp: not developers who dismiss AI, not people shipping code they don't understand. If the problem is real, the plan comes first and the code follows.",
  "You can't judge work you don't understand. I learned that the expensive way, so now I understand every layer of what I build.",
];
