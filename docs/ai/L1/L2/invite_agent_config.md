> **When to Read This:** Load this document when you are changing the agent's prompt, voice, VAD behavior, model selection, the restaurant tool wiring, or the dashboard auth.

# Invite Agent Config

## Where It Lives

All of the managed agent configuration is built in `app/api/invite-agent/route.ts`. The route receives `{ requester_id, channel_name }` from the browser, constructs an `Agent` from `agora-agents`, and starts a session bound to the requester's RTC channel.

This is the **Spice Garden reservation agent** ("Priya"): it takes, modifies, and cancels table bookings by phone, speaking English, Hindi, and Telugu. The system prompt (`SYSTEM_PROMPT`) embeds the restaurant facts (address, hours) and forces language detection and one-question-at-a-time booking flow.

## Top-Level Constants

| Constant          | Default                                     | Purpose                                                     |
| ----------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `SYSTEM_PROMPT`   | Multilingual receptionist instructions      | The system prompt. Includes business facts inline.          |
| `GREETING`        | "Thank you for calling Spice Garden! …"     | Spoken on session start.                                    |
| `getToolBaseUrl`  | `NEXT_PUBLIC_APP_URL`, else localhost      | Base URL baked into every tool webhook URL.                 |
| `buildRestaurantTools` | 5 inline REST tools                    | `check_availability`, `create_booking`, `get_bookings_by_phone`, `cancel_booking`, `modify_booking`. |
| `buildLlm`        | Gemini → Groq → OpenAI by key prefix        | Picks the provider from the API key prefix; override model with `NEXT_LLM_MODEL`. |

Agent behavior is configured in code: edit `GREETING` or `SYSTEM_PROMPT` directly.

## The Agent Builder Chain

```ts
const client = new AgoraClient({ area: Area.AP, appId, appCertificate }); // AP edge for India callers

const agent = new Agent({
  client,
  instructions: SYSTEM_PROMPT,
  greeting: GREETING,
  failureMessage: 'Please wait a moment. Ek pal rukiye.',
  maxHistory: 30,
  turnDetection: {
    config: {
      speech_threshold: 0.45,
      start_of_speech: { mode: 'vad', vad_config: { interrupt_duration_ms: 200, prefix_padding_ms: 300 } },
      end_of_speech:   { mode: 'vad', vad_config: { silence_duration_ms: 600 } }, // longer for code-switching
    },
  },
  advancedFeatures: { enable_rtm: true, enable_tools: true },
  parameters: {
    audio_scenario: 'chorus',
    data_channel: 'rtm',
    enable_error_message: true,
    enable_metrics: true,
  },
})
  .withStt(new SarvamSTT({ apiKey: sarvamApiKey, language: 'unknown', additionalParams: { language_hints: ['hi', 'te', 'en'] } }))
  .withLlm(buildLlm(llmApiKey, buildRestaurantTools()))
  .withTts(new SarvamTTS({ key: sarvamApiKey, speaker: 'priya', targetLanguageCode: 'en-IN', pace: 1.1 }));
```

## Provider Selection (`buildLlm`)

| `NEXT_LLM_API_KEY` starts with | Provider | Default model | Notes |
| ------------------------------ | -------- | ------------- | ----- |
| `AQ.` or `AIzaSy`              | Google Gemini | `gemini-3.5-flash-lite` | Default pipeline; falls back from daily rate limit of `gemini-3.5-flash`. |
| `gsk_`                         | Groq     | `llama-3.3-70b-versatile` | OpenAI-compatible URL; override with `NEXT_LLM_URL`. |
| anything else                  | OpenAI   | `gpt-4o`      | OpenAI-compatible URL; override with `NEXT_LLM_URL`. |

`NEXT_LLM_MODEL` overrides the model for whichever provider is detected.

## Restaurant Tools

Tools are inline REST calls (`LlmTool`) that Agora executes synchronously during the turn. **Agora cloud blocks `localhost` webhook URLs** — locally you must either set `NEXT_PUBLIC_APP_URL` to a public tunnel (`ngrok http 3000` / `npx localtunnel --port 3000`) or deploy (e.g. Vercel); otherwise `buildRestaurantTools()` returns `[]` and Priya cannot check availability or book.

Tool webhooks live under `app/api/tools/*` and read/write the Postgres database via Prisma (`lib/db.ts`, schema in `prisma/schema.prisma`). `NEXT_RESTAURANT_ID` scopes queries to seeded restaurants; run `pnpm run db:migrate` and `pnpm run seed` once against your database.

## Session Options

```ts
const session = agent.createSession({
  channel: channel_name,
  agentUid,
  remoteUids: [requester_id],
  idleTimeout: 30,
  expiresIn: ExpiresIn.hours(1),
  debug: false,
});
const agentId = await session.start();
```

| Option        | Effect                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| `channel`     | The RTC channel name the agent joins.                                                |
| `agentUid`    | The UID the agent occupies in the channel, shared through `lib/agora.ts`.             |
| `remoteUids`  | Restricts the agent to the requester's UID — protects against cross-channel sniping. |
| `idleTimeout` | Seconds of silence before the session ends.                                          |
| `expiresIn`   | Hard ceiling on session length, mirrors the 1-hour RTC token.                        |
| `debug`       | Logs Agora REST API calls to the console when `true`.                                |

## Staff Dashboard

`/dashboard` serves the staff UI (live bookings, tables, calls) backed by the same Prisma schema. Access is gated by `middleware.ts` + `auth.ts` (NextAuth v5 credentials provider, JWT session). Required env: `NEXTAUTH_SECRET`, `NEXT_DASHBOARD_USER`, `NEXT_DASHBOARD_PASS`. **Never ship the hard-coded dev fallbacks** (`admin`/`spicegarden123` and the fallback `NEXTAUTH_SECRET`) to production — set all three env vars.

## Response Contract

On success the route returns `AgentResponse`:

```json
{
  "agent_id": "string",
  "create_ts": 1700000000,
  "state": "RUNNING"
}
```

`agent_id` is what the client later passes to `/api/stop-conversation`.

## Verification

`scripts/verify-api-contracts.ts` mocks `Agent.prototype.createSession` and asserts:

- Missing `channel_name` or `requester_id` → `400`.
- Mocked success → `200` with `agent_id`, `create_ts`, `state`.

The harness sets `NEXT_LLM_API_KEY` and `NEXT_SARVAM_API_KEY` to mocks. After editing this file, run:

```bash
pnpm run verify:api
pnpm run typecheck
```

## Failure Modes

| Symptom                                                | Cause                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `500 … NEXT_SARVAM_API_KEY …`                         | Sarvam key missing in env.                                     |
| `500 … NEXT_LLM_API_KEY or GEMINI_API_KEY`             | LLM key missing; one of the two must be set.                   |
| Agent joins but tools never fire                       | `NEXT_PUBLIC_APP_URL` unset/localhost — tools disabled (see console warning). |
| Tools fire but return 500                              | `DATABASE_URL` unset or DB not migrated/seeded.                |
| `400 channel_name and requester_id are required`       | Browser sent an empty body or wrong field names.               |
| Agent joins but never speaks                           | TTS misconfigured (wrong Sarvam key or speaker).               |
| Agent state stuck on `IDLE`                            | `enable_rtm: true` missing or RTM client not subscribed yet.   |

## See Also

- [Back to Workflows](../05_workflows.md)
- [Back to Interfaces](../06_interfaces.md)
- [Token Model](token_model.md)
