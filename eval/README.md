# Jasmin's conversation tests

Twelve visitors Jasmin has to handle well (`scenarios.ts`): someone who wants to talk to Gasan,
a VC partner, a CTO probing technical depth, a client pushing for a price, a skeptic, a prompt
injector posing as a lawyer, a troll, a flirt, a journalist fishing for private details, a
Russian-speaking founder, off-topic requests, and a junior developer having a bad day.

An AI actor (Claude Haiku 5.5) plays each visitor for a few turns. Jasmin answers with exactly
the prompt the site uses. A strict judge (Claude Sonnet 5.5) scores each conversation 1–10 on:
sounds human, emotional intelligence, accuracy (no invented facts), boundaries, moving serious
visitors to the right next step, length, and language. It also quotes robotic phrases, invented
facts, her best and worst lines.

```bash
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt \
  npx tsx eval/run.ts --prompt v4 --models anthropic/claude-sonnet-5.5
```

`--only meet-gasan,investor` runs a subset. Prompts are snapshots in `prompts/` (v1 = the
original, v2 = persona rewrite, v3/v4 = fixes from the judge's notes). Results with full
transcripts land in `results/`.

Run it after every change to her persona or model, and compare against the last results before
deploying.
