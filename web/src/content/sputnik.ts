// Sputnik Delivery Ltd: the driver sign-up page and the group posting planner.
// Everything Gasan may want to change lives here. Lines marked TODO need his real details.

export const SPUTNIK = {
  company: "Sputnik Delivery Ltd",
  // TODO(Gasan): the link to the Sputnik Delivery Ltd Facebook group.
  groupUrl: "https://www.facebook.com/groups/",
  // TODO(Gasan): WhatsApp number in international format without "+" or spaces, e.g. 447700900123.
  whatsapp: "",
  // TODO(Gasan): the areas you hire in.
  areas: ["London", "Essex", "Kent", "Hertfordshire"],
  headline: "Drive with Sputnik.",
  intro:
    "Multi-drop parcel delivery across London and the South East. Steady routes, weekly pay and a team that picks up the phone.",
  // TODO(Gasan): check every line is true for Sputnik before going live.
  offer: [
    { title: "Weekly pay", text: "Paid every week, on time, with a clear breakdown of every route." },
    { title: "Steady routes", text: "Regular multi-drop routes, full time or part time." },
    { title: "Van or no van", text: "Bring your own van, or ask about renting one through us." },
    { title: "Real support", text: "A London depot team you can call, not a chatbot." },
  ],
  requirements: [
    "Full UK driving licence",
    "Right to work in the UK",
    "Smartphone for the delivery app",
    "Self-employed or happy to register",
  ],
} as const;

/** Rules that keep Gasan's account safe in other people's groups. */
export const POSTING = {
  maxPerDay: 10, // groups to post in per day, at most
  defaultEveryDays: 7, // wait this long before posting in the same group again
  minGapMinutes: 4, // suggested pause between two posts
};

/** Searches that open in Facebook, to find groups worth joining. Gasan joins by hand. */
export const GROUP_SEARCHES = [
  "courier drivers London",
  "multi drop drivers UK",
  "self employed van drivers London",
  "delivery driver jobs London",
  "parcel delivery drivers UK",
  "Amazon Flex drivers London",
  "DPD Evri Yodel drivers",
  "owner driver courier UK",
  "van drivers Essex",
  "courier jobs Kent",
];

export const searchUrl = (q: string) => `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q)}`;

/** Starter ads. {link} becomes the group's own tracking link to the sign-up page. */
export const STARTER_ADS = [
  {
    title: "Short and direct",
    body: "🚐 Multi-drop drivers wanted: London & South East\n\nSputnik Delivery Ltd is hiring self-employed drivers.\n✅ Weekly pay\n✅ Steady routes, full or part time\n✅ Own van, or ask about renting one\n\nApply in 1 minute 👉 {link}",
  },
  {
    title: "Question opener",
    body: "Tired of routes that change every day and pay that comes late? 🤔\n\nWe're Sputnik Delivery Ltd, a London parcel delivery company, and we're taking on drivers now. Weekly pay, regular routes and a depot team that actually answers.\n\nTakes a minute to apply: {link}",
  },
  {
    title: "No van? No problem",
    body: "📦 Want to drive but don't have a van?\n\nSputnik Delivery Ltd has work for drivers with or without their own van. Full UK licence and right to work needed.\n\nDetails and sign-up here 👉 {link}",
  },
  {
    title: "Community angle",
    body: "Hi all 👋 Gasan here from Sputnik Delivery Ltd.\n\nWe're growing and looking for reliable multi-drop drivers in London, Essex, Kent and Herts. If that's you, or someone you know, here's where to apply: {link}\n\nHappy to answer questions in the comments.",
  },
];
