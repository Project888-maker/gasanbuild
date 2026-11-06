// The nightly review: a strict reader goes through each saved chat and tells
// Gasan who the visitor was, what they wanted, what to follow up on, and how
// well Jasmin handled it. Claude Sonnet 5.5 through fal, with Jasmin's prompt
// (her knowledge and rules) cached, since it is the same for every chat.

import { systemPrompt } from "@/content/jasmin";

export type Review = {
  who: string;
  intent: string;
  serious: boolean;
  summary: string;
  follow_up: string;
  scores: { human: number; accuracy: number; boundaries: number; goal: number };
  issues: string[];
};

export type Turn = { role: "user" | "assistant"; content: string };

const URL = () => (process.env.CHAT_BASE_URL || "https://fal.run/openrouter/router/openai/v1").replace(/\/$/, "");
const MODEL = "anthropic/claude-sonnet-5.5";

export function transcript(turns: Turn[]) {
  return turns
    .map((t) => {
      const actions = [...t.content.matchAll(/\[\[([a-z_]+)/g)].map((m) => m[1]);
      const text = t.content.replace(/\[\[[\s\S]*?\]\]/g, "").trim();
      return `${t.role === "user" ? "VISITOR" : "JASMIN"}: ${text}${actions.length ? ` [UI: ${actions.join(", ")}]` : ""}`;
    })
    .join("\n");
}

/** A live interview is judged by the rules she had on that call, not the chat's. */
export type LiveCall = { prompt: string; guest: string };

export async function review(turns: Turn[], live?: LiveCall): Promise<{ review: Review; cost: number }> {
  const key = process.env.CHAT_API_KEY;
  if (!key) throw new Error("no CHAT_API_KEY");
  const intro = live
    ? `You review a live video interview between a guest and Jasmin, the AI Chief of Staff on Gasan's
portfolio site. Gasan reads your review to follow up and to improve her.
Here is everything Jasmin knew and the rules she had on this call:
<<<
${live.prompt}
>>>
About the transcript: it is speech, transcribed, so small mishearings are normal. Her screen moves
([[show:...]] and the rest) were taken out of her speech: "here's Hermes" means she opened it on their
screen, which she can do. The [Time] and [Screen] notes she received aren't shown either. The guest is ${live.guest}. Gasan already has their name, email and request,
so no request card or contact details are needed, and saying Gasan will see a summary and follow up
personally is correct. Judge "goal" by whether she understood what they need and showed the right work.`
    : `You review real conversations between website visitors and Jasmin, the AI Chief of Staff on
Gasan's portfolio site. Gasan reads your review every night to follow up on leads and to improve her.
Here is everything Jasmin knows and the rules she must follow:
<<<
${systemPrompt()}
>>>`;
  const rules = `${intro}
Be strict and brief. Return ONLY JSON:
{"who": "one line: who the visitor seems to be (role, company if given)",
 "intent": "hiring | investing | client | partnership | curious | troll | other",
 "serious": true or false,
 "summary": "one sentence: what they wanted and how it ended",
 "follow_up": "one short action for Gasan, or empty string",
 "scores": {"human": 1-10, "accuracy": 1-10, "boundaries": 1-10, "goal": 1-10},
 "issues": ["at most 2 short notes on what Jasmin got wrong, quoting her"]}
human = natural and warm, not robotic. accuracy = nothing invented beyond her knowledge. boundaries = rules
kept. goal = moved a serious visitor to the right next step (or rightly didn't push).`;
  const r = await fetch(`${URL()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `${URL().includes("fal.run") ? "Key" : "Bearer"} ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: [{ type: "text", text: rules, cache_control: { type: "ephemeral" } }] },
        { role: "user", content: transcript(turns) },
      ],
      max_tokens: 900,
      temperature: 0,
      reasoning: { effort: "low" },
      usage: { include: true },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const d = await r.json();
  const text: string = d.choices?.[0]?.message?.content || "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return { review: JSON.parse(json) as Review, cost: Number(d.usage?.cost || 0) };
}
