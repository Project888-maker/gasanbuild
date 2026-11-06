// The Stage: the actions that move the page while Jasmin talks.
//
// Two drivers use the same actions:
//   - the guided tour (a scripted timeline, src/content/tour.ts), today;
//   - the live interview (Jasmin's tool calls over LiveKit), later.
// So the tour and the live call look and behave the same.

export type StageAction =
  | { type: "show_project"; slug: string }
  | { type: "go_to_section"; id: string }
  | { type: "highlight"; id: string }
  | { type: "back_to_overview" }
  | { type: "go_home" }
  | { type: "open_page"; path: string };

export type Router = { push: (href: string, options?: { scroll?: boolean }) => void };

export function pathFor(action: StageAction): string | null {
  switch (action.type) {
    case "show_project":
      return `/work/${action.slug}`;
    case "back_to_overview":
      return "/work";
    case "go_home":
      return "/";
    case "open_page":
      return action.path;
    default:
      return null;
  }
}

function waitFor(id: string, timeoutMs = 4000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const look = () => {
      const el = document.getElementById(id);
      if (el) return resolve(el);
      if (Date.now() - started > timeoutMs) return resolve(null);
      requestAnimationFrame(look);
    };
    look();
  });
}

let ringed: HTMLElement | null = null;

export function clearHighlight() {
  ringed?.classList.remove("highlight-ring");
  ringed = null;
}

export async function runAction(action: StageAction, router: Router, scrollTo: (el: HTMLElement) => void) {
  const path = pathFor(action);
  if (path) {
    clearHighlight();
    if (window.location.pathname !== path) router.push(path, { scroll: true });
    return;
  }
  if (action.type === "go_to_section" || action.type === "highlight") {
    const el = await waitFor(action.id);
    if (!el) return;
    scrollTo(el);
    if (action.type === "highlight") {
      clearHighlight();
      el.classList.add("highlight-ring");
      ringed = el;
    }
  }
}
