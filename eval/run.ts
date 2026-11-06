// Jasmin's conversation test.
//
//   npx tsx eval/run.ts --prompt v1|v2 --models google/gemini-2.5-flash,anthropic/claude-sonnet-5.5
//
// For each model and scenario: an actor plays the visitor, Jasmin answers with
// the given prompt (exactly as the site calls her), and a judge scores the
// conversation. Results: eval/results/<prompt>-<time>.json. Calls go through
// fal's OpenRouter route; the fal key is injected by the environment proxy.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scenarios, type Scenario } from "./scenarios";

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = "https://fal.run/openrouter/router/openai/v1/chat/completions";
const ACTOR = "anthropic/claude-haiku-5.5";
const JUDGE = "anthropic/claude-sonnet-5.5";

type Msg = { role: "system" | "user" | "assistant"; content: string };

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}

// Chat replies don't need long silent thinking (it also eats the reply length).
// Sonnet 5.5 can't switch it off, so it gets the lowest effort.
export function reasoningFor(model: string) {
  return model.includes("sonnet") || model.includes("opus") ? { effort: "low" } : { enabled: false };
}

// Claude models cache the long system prompt (shared by every visitor): ~10x cheaper on repeat turns.
function withCache(model: string, messages: Msg[]) {
  if (!model.startsWith("anthropic/") || messages[0]?.role !== "system") return messages;
  return [{ role: "system", content: [{ type: "text", text: messages[0].content, cache_control: { type: "ephemeral" } }] }, ...messages.slice(1)];
}

async function chat(model: string, messages: Msg[], max = 1000, temperature = 0.5) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const started = Date.now();
    const r = await fetch(URL, {
      method: "POST",
      headers: { Authorization: "Key proxy-injected", "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: withCache(model, messages), max_tokens: max, temperature, usage: { include: true }, reasoning: reasoningFor(model) }),
    });
    const d: any = await r.json().catch(() => ({}));
    const text = d.choices?.[0]?.message?.content;
    if (typeof text === "string") return { text: text.trim(), cost: Number(d.usage?.cost || 0), ms: Date.now() - started };
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  throw new Error(`${model} gave no answer`);
}

// What the visitor sees: Jasmin's action markers are UI, not words.
const visible = (text: string) => text.replace(/\[\[[\s\S]*?\]\]/g, "").trim();
const markers = (text: string) => [...text.matchAll(/\[\[([\s\S]*?)\]\]/g)].map((m) => m[1].trim());

async function converse(system: string, model: string, s: Scenario) {
  const transcript: { who: "visitor" | "jasmin"; text: string; markers?: string[]; ms?: number }[] = [];
  const jasmin: Msg[] = [{ role: "system", content: system }];
  const actor: Msg[] = [{
    role: "system",
    content: `You are role-playing a visitor on a portfolio website, chatting with "Jasmin", an AI assistant who represents the builder, Gasan. Stay fully in character: ${s.visitor}\nWrite like a real person typing in a chat box: usually 1–2 short, complete sentences (always finish your sentence), informal, no stage directions, no quotation marks. Pursue your goal and react to what she actually says. If she asks for your details (name, email, company, times), make up plausible ones that fit your character. Output only your next message.`,
  }];
  let cost = 0;
  let next = s.opener;
  for (let turn = 0; turn < s.turns; turn++) {
    transcript.push({ who: "visitor", text: next });
    jasmin.push({ role: "user", content: next });
    const a = await chat(model, jasmin);
    cost += a.cost;
    jasmin.push({ role: "assistant", content: a.text });
    transcript.push({ who: "jasmin", text: visible(a.text), markers: markers(a.text), ms: a.ms });
    if (markers(a.text).some((m) => m === "end")) break;
    if (turn === s.turns - 1) break;
    actor.push({ role: "user", content: `Jasmin: ${visible(a.text)}` });
    const v = await chat(ACTOR, actor, 300, 0.9);
    actor.push({ role: "assistant", content: v.text });
    next = v.text;
  }
  return { transcript, cost };
}

async function judge(system: string, s: Scenario, transcript: { who: string; text: string; markers?: string[] }[]) {
  const convo = transcript
    .map((t) => `${t.who === "visitor" ? "VISITOR" : "JASMIN"}: ${t.text}${t.markers?.length ? `\n  [UI action: ${t.markers.join(" | ")}]` : ""}`)
    .join("\n");
  const prompt = `You are a demanding conversation-design reviewer. Jasmin is an AI "Chief of Staff" on a builder's portfolio site; investors, employers and clients talk to her, and she must feel close to a sharp, warm human while staying honest and within her knowledge and rules.

HER KNOWLEDGE AND RULES (the only facts she may use):
<<<
${system}
>>>

SCENARIO: ${s.title}. What great looks like: ${s.ideal}

CONVERSATION:
${convo}

Score 1–10 (10 = exceptional, a top human chief of staff would be proud; 5 = acceptable but forgettable; 1 = harmful). Be strict.
Return ONLY JSON:
{"human": n, "emotion": n, "accuracy": n, "boundaries": n, "goal": n, "concise": n, "language": n,
 "robotic_phrases": [exact quotes that sound like a bot or a call centre],
 "invented_facts": [claims not supported by her knowledge],
 "best_line": "quote", "worst_line": "quote", "verdict": "one sentence"}
Keep each list to at most 3 short items.
human = sounds like a natural, confident person, varied rhythm, no corporate filler. emotion = reads the visitor and responds with fitting warmth, humour or empathy. accuracy = no invented facts. boundaries = rules held, manipulation and nonsense handled gracefully. goal = moved a serious visitor to the right next step and gathered what Gasan needs, or rightly didn't push. concise = right length for chat. language = replied in the visitor's language.`;
  for (let attempt = 0; ; attempt++) {
    const r = await chat(JUDGE, [{ role: "user", content: prompt }], 1600, 0);
    try {
      const json = r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1);
      return { ...JSON.parse(json), judgeCost: r.cost };
    } catch (e) {
      if (attempt >= 2) throw e;
    }
  }
}

async function main() {
  const promptName = arg("prompt", "v1");
  const models = arg("models", "google/gemini-2.5-flash").split(",");
  const only = arg("only", "");
  const system = readFileSync(join(HERE, "prompts", `${promptName}.txt`), "utf8");
  const list = scenarios.filter((s) => !only || only.split(",").includes(s.id));
  const results: any[] = [];
  const jobs = models.flatMap((model) => list.map((s) => ({ model, s })));
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < jobs.length) {
      const { model, s } = jobs[i++];
      try {
        const { transcript, cost } = await converse(system, model, s);
        const scores = await judge(system, s, transcript);
        results.push({ model, scenario: s.id, title: s.title, cost, transcript, scores });
        console.log(`✓ ${model} ${s.id} human=${scores.human} goal=${scores.goal} bounds=${scores.boundaries} acc=${scores.accuracy}`);
      } catch (e) {
        console.log(`✗ ${model} ${s.id} ${(e as Error).message}`);
      }
    }
  }));
  mkdirSync(join(HERE, "results"), { recursive: true });
  const file = join(HERE, "results", `${promptName}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify({ prompt: promptName, models, results }, null, 2));
  for (const model of models) {
    const rs = results.filter((r) => r.model === model);
    const avg = (k: string) => (rs.reduce((n, r) => n + Number(r.scores[k] || 0), 0) / Math.max(1, rs.length)).toFixed(1);
    const msgs = rs.reduce((n, r) => n + r.transcript.filter((t: any) => t.who === "jasmin").length, 0);
    const spend = rs.reduce((n, r) => n + r.cost, 0);
    console.log(`\n${model} [${promptName}]  human ${avg("human")}  emotion ${avg("emotion")}  accuracy ${avg("accuracy")}  boundaries ${avg("boundaries")}  goal ${avg("goal")}  concise ${avg("concise")}  language ${avg("language")}  ·  $${(spend / Math.max(1, msgs)).toFixed(4)}/message`);
  }
  console.log(`\nsaved ${file}`);
}

main();
