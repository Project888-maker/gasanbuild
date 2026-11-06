// The live video interview runs on Gasan's own server (Hermes), which brings
// Jasmin's ElevenLabs voice and lip-synced avatar. Its public address is
// NEXT_PUBLIC_PRESENTER_URL; while it isn't set, the site says the live room
// isn't open yet and offers chat and the tour instead.

export const PRESENTER_URL = (process.env.NEXT_PUBLIC_PRESENTER_URL || "").trim().replace(/\/$/, "");

export const liveOn = () => Boolean(PRESENTER_URL);

export type LiveRequest = { token: string; name: string; minutes: number };

/** Start (or return to) the live interview from any button on the site. */
export function startLive(request: LiveRequest) {
  window.dispatchEvent(new CustomEvent<LiveRequest>("jasmin-live", { detail: request }));
}

let active = false;

/** Tells the rest of the site (Jasmin's chat dock, the room's button) whether a live call is on. */
export function announceLive(on: boolean) {
  active = on;
  window.dispatchEvent(new CustomEvent<boolean>("jasmin-live-state", { detail: on }));
}

export const isLive = () => active;
