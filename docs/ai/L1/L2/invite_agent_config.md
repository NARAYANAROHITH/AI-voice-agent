> **When to Read This:** Load this document when you are changing the agent's prompt, voice, VAD behavior, model selection, or wiring a bring-your-own-key (BYOK) provider.

# Invite Agent Config

## Where It Lives

All of the managed agent configuration is built in `app/api/invite-agent/route.ts`. The route receives `{ requester_id, channel_name }` from `LandingPage`, constructs an `Agent` from `agora-agents`, and starts a session bound to the requester's RTC channel.

## Top-Level Constants

| Constant            | Default                                                    | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `PRIYA_PROMPT`      | Short, caveman-style instructions for "Priya", Spice Garden | The system prompt for the LLM. Shorter = lower TTFT.       |
| `TEMPLATE_VARIABLES`| `hours` / `address` from `RESTAURANT_*` env vars           | Fills `{{hours}}` / `{{address}}` in the prompt.           |
| `GREETING`          | Reservation-desk first line                                | Spoken on session start.                                   |
| `availabilityTool()`| `check_availability` REST tool, or `null`                  | Built only when `NEXT_RESERVATIONS_API_URL` is set.        |

Agent behavior is configured in code: edit `GREETING` or `PRIYA_PROMPT` directly.

## Latency Design

The pipeline is already streaming (Deepgram partials → gpt-4o-mini tokens → MiniMax), so per-turn latency is dominated by these knobs:

| Knob                          | Value   | Why                                                        |
| ----------------------------- | ------- | ---------------------------------------------------------- |
| `end_of_speech.silence_duration_ms` | `320` | Dead air before the agent replies. Was `480`.        |
| `start_of_speech.interrupt_duration_ms` | `120` | How fast a caller can barge in. Was `160`.            |
| `max_tokens`                  | `160`   | Caps a reply at ~2 sentences; keeps streamed TTS short.    |
| `maxHistory`                  | `12`    | Fewer input tokens → faster first token.                   |
| Prompt length                 | ~8 lines | Business facts live in `TEMPLATE_VARIABLES`, not the prompt. |
| `server.timeout_ms` on the tool | `1200` | A slow backend fails fast instead of stalling the turn.   |

Do not "fix" latency by calling the LLM again in a separate route — one turn means one LLM call plus, at most, one tool call.

## The Agent Builder Chain

`AgoraClient` is constructed first — it carries the region and credentials for all API calls. `area` belongs here, not on the session.

```ts
const client = new AgoraClient({ area: Area.US, appId, appCertificate });

const agent = new Agent({
  client,
  instructions: PRIYA_PROMPT,
  greeting: GREETING,
  failureMessage: 'Sorry, I missed that. Could you say it again?',
  maxHistory: 12,
  turnDetection: {
    config: {
      speech_threshold: 0.5,
      start_of_speech: { /* VAD on-start params */ },
      end_of_speech:   { /* VAD on-end params */ },
    },
  },
  advancedFeatures: { enable_rtm: true, enable_tools: true },
  parameters: {
    data_channel: 'rtm',
    enable_error_message: true,
    enable_metrics: true,
  },
})
  .withStt(new DeepgramSTT({ model: 'nova-3', language: 'en' }))
  .withLlm(new OpenAI({
    model: 'gpt-4o-mini',
    greetingMessage: GREETING,
    failureMessage: 'Sorry, I missed that. Could you say it again?',
    maxHistory: 12,
    templateVariables: TEMPLATE_VARIABLES,
    params: { max_tokens: 160, temperature: 0.4, top_p: 0.9 },
    tools: tool ? [tool] : undefined,
  }))
  .withTts(new MiniMaxTTS({
    model: 'speech_2_6_turbo',
    voiceId: 'English_captivating_female1',
  }));
```

## Availability Tool

`check_availability({ date, time, party_size })` is an inline REST tool (`LlmTool`) the Agora service executes synchronously during the turn. It issues a single `GET {NEXT_RESERVATIONS_API_URL}/availability?date=&time=&party_size=` with a 1200 ms timeout.

- Keep the endpoint read-only and served from an index/cache — no write-then-read dance.
- `enable_tools: true` is required for the tool to be offered to the LLM.
- Unset `NEXT_RESERVATIONS_API_URL` → no tool is registered, and the prompt tells the agent to take a callback instead of guessing availability.

## Session Options

`createSession` takes the `AgoraClient` as its first argument, then the session options object. `session.start()` is called separately and returns the `agentId`.

```ts
const session = agent.createSession(client, {
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

## Editing Each Surface

### Change the prompt

Edit `PRIYA_PROMPT` and keep it short — every extra token is latency before the first spoken word. Put business facts in `TEMPLATE_VARIABLES` (or the `RESTAURANT_*` env vars) and reference them as `{{hours}}` / `{{address}}` instead of writing them into the prompt.

### Change the greeting

Edit `GREETING` in `app/api/invite-agent/route.ts`.

### Change VAD behavior

Edit `turnDetection.config.start_of_speech` and `turnDetection.config.end_of_speech`. Both blocks accept the new VAD param shape — do **not** revert to the deprecated `turnDetection.type: 'agora_vad'`. Lower `silence_duration_ms` for faster replies; raise it if callers get cut off mid-sentence.

### Swap the STT model

Replace the `DeepgramSTT` constructor. To use Deepgram with a BYOK key, set `NEXT_DEEPGRAM_API_KEY` and pass `apiKey: process.env.NEXT_DEEPGRAM_API_KEY` to the constructor.

### Swap the LLM

Replace `OpenAI` with another LLM class from `agora-agents`. For a custom URL, point the constructor at `process.env.NEXT_LLM_URL` and pass `apiKey: process.env.NEXT_LLM_API_KEY`. Wiring through `app/api/chat/completions/route.ts` is documented in `docs/ai/L1/05_workflows.md`.

### Swap the TTS

Replace `MiniMaxTTS`. ElevenLabs is the common BYOK choice — use `NEXT_ELEVENLABS_API_KEY` and `NEXT_ELEVENLABS_VOICE_ID`. The commented BYOK example in the route shows the constructor shape.

## Response Contract

On success the route returns `AgentResponse`:

```json
{
  "agent_id": "string",
  "create_ts": 1700000000,
  "state": "RUNNING"
}
```

`agent_id` is what `LandingPage` later passes to `/api/stop-conversation`.

## Verification

`scripts/verify-api-contracts.ts` mocks `Agent.prototype.createSession` and asserts:

- Missing `channel_name` or `requester_id` → `400`.
- Mocked success → `200` with `agent_id`, `create_ts`, `state`.

After editing this file, run:

```bash
pnpm run verify:api
pnpm run typecheck
```

## Failure Modes

| Symptom                                                | Cause                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `400 channel_name and requester_id are required`       | Browser sent an empty body or wrong field names.               |
| `500 Agora credentials are not set`                    | `NEXT_AGORA_APP_CERTIFICATE` missing in env.                   |
| Agent joins but never speaks                           | TTS misconfigured (wrong `voiceId` or missing BYOK key).       |
| Agent state stuck on `IDLE`                            | `enable_rtm: true` missing or RTM client not subscribed yet.   |
| `verify:api` fails on the route                        | New required field added without updating the harness.         |

## See Also

- [Back to Workflows](../05_workflows.md)
- [Back to Interfaces](../06_interfaces.md)
- [Token Model](token_model.md)
