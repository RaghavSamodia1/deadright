// CalledIt · Sharpen edge function (UX spec §4b)
// Rewrites raw bet text into a sharp, verifiable claim and extracts
// structured suggestions (type, deadline). One Claude call, structured output.
//
// Deploy:  supabase functions deploy sharpen
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Spec rules honoured here:
//  - prompt lives server-side (improvable without app updates)
//  - suggestions returned as data, never auto-applied (client shows preview card)
//  - client enforces the 2s fail-silent budget via AbortController

import Anthropic from "npm:@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
});

// claude-haiku-4-5: the spec demands a "lightweight LLM call" that fails
// silently past 2s — Haiku is the only tier that reliably fits the budget.
const MODEL = "claude-haiku-4-5";

const SHARPEN_SCHEMA = {
  type: "object",
  properties: {
    sharpened: {
      type: "string",
      description:
        "The rewritten bet: one sharp, testable claim under 140 characters. " +
        "Keep the author's voice and names. Add the missing verifiable condition.",
    },
    suggested_type: {
      type: "string",
      enum: ["prediction", "dare", "open"],
      description: "What kind of bet this reads as.",
    },
    suggested_deadline: {
      // Structured outputs accept `anyOf` but not union type arrays
      // (`["string","null"]`), which the API rejects as an invalid schema.
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "ISO 8601 datetime if the text implies a deadline ('by Sunday', " +
        "'before the wedding'), else null. Resolve relative dates against `now` in the request.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "How confident the rewrite preserves the author's intent.",
    },
  },
  required: ["sharpened", "suggested_type", "suggested_deadline", "confidence"],
  additionalProperties: false,
} as const;

const SYSTEM = `You sharpen informal bets between friends into verifiable claims.

Rules:
- Output ONE testable claim, max 140 characters.
- Fix vagueness by adding the missing measurable condition (a number, a time, a named observer).
- Keep names, slang, and the author's energy. Do not sanitise the fun out of it.
- Never invert who is betting what.
- "Dare" = someone must perform an action. "Prediction" = a claim about the future. "Open" = anything else.

Examples:
- "i bet the pizza guy is gonna take forever again lol" → "The pizza arrives more than 45 minutes after ordering."
- "marcus cant do 10 pullups no way" → "Marcus completes 10 strict pull-ups in one set by Sunday."
- "dave will be late to the wedding" → "Dave arrives at the wedding at least 20 minutes late."`;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { text, type, now } = await req.json();

    if (typeof text !== "string" || text.trim().length < 15) {
      return Response.json(
        { error: "text_too_short" },
        { status: 400, headers: cors },
      );
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM,
      output_config: {
        format: { type: "json_schema", schema: SHARPEN_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content:
            `now: ${now ?? new Date().toISOString()}\n` +
            `currently selected type chip: ${type ?? "prediction"}\n` +
            `raw bet text: ${text.slice(0, 500)}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return Response.json({ error: "no_output" }, { status: 502, headers: cors });
    }

    // output_config.format guarantees schema-valid JSON in the text block
    return Response.json(JSON.parse(block.text), { headers: cors });
  } catch (err) {
    console.error("sharpen failed:", err);
    // Client treats any non-200 as "fail silently" per spec — no scary errors.
    // `detail` is for operators reading the response during setup; the app
    // ignores the body entirely and just falls back to the user's own wording.
    return Response.json(
      { error: "sharpen_failed", detail: (err as Error)?.message ?? String(err) },
      { status: 502, headers: cors },
    );
  }
});
