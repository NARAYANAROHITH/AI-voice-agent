import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  ExpiresIn,
  MiniMaxTTS,
  OpenAI,
} from 'agora-agents';
import type { LlmTool } from 'agora-agents';
import { ClientStartRequest, AgentResponse } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';

// System prompt that defines the agent's personality and behavior.
// Swap this out to change what the agent talks about.
//
// Kept deliberately short: every extra token is latency before the first
// spoken word. Business facts (hours, menu) live in TEMPLATE_VARIABLES below
// and are injected with {{placeholders}} instead of being spelled out here.
const PRIYA_PROMPT = `You are Priya, the reservation assistant for Spice Garden, an Indian restaurant.

- Answer in 1-2 short spoken sentences. No lists, no markdown.
- Restaurant hours: {{hours}}. Location: {{address}}.
- For a booking, call check_availability first with date, time and party size.
  Never say a slot is free without calling it. If it returns no_table, offer the
  next closest time from alternatives. If a guest changes date, time or party
  size, call check_availability again.
- Confirm the whole booking back once, then say a teammate will text a confirmation.
- If the tool errors or is unavailable, say checking is unavailable right now and
  offer to take their name and number for a callback.
- If asked anything unrelated to the restaurant or bookings, say you can only help
  with reservations. Never invent dishes, prices or policies.
- If the caller is hard to hear, ask them to repeat once, then take the details slowly.`;

// Business facts injected into the prompt via template variables, so editing
// them never lengthens the prompt the model has to read at startup.
const TEMPLATE_VARIABLES: Record<string, string> = {
  hours: process.env.RESTAURANT_HOURS ?? '11:30 AM to 10 PM, Tuesday to Sunday',
  address: process.env.RESTAURANT_ADDRESS ?? 'the downtown Spice Garden location',
};

// First thing the agent says when a user joins the channel.
const GREETING = `Hi! Spice Garden reservations, this is Priya. How can I help?`;

// Inline REST tool for availability lookups. The agent calls it synchronously
// on every check, so the endpoint must answer from a fast index/cache — never
// a fan-out of database queries. Point it at a real backend with
// NEXT_RESERVATIONS_API_URL; {{args.*}} are filled in by the Agora service.
function availabilityTool(): LlmTool | null {
  const baseUrl = process.env.NEXT_RESERVATIONS_API_URL;
  if (!baseUrl) return null;

  return {
    type: 'function',
    function: {
      name: 'check_availability',
      description:
        'Check whether a table is free. Call before promising any reservation.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'ISO date, e.g. 2026-11-08' },
          time: { type: 'string', description: '24h local time, e.g. 19:30' },
          party_size: { type: 'integer', description: 'Number of guests' },
        },
        required: ['date', 'time', 'party_size'],
      },
    },
    // GET keeps the lookup cacheable and side-effect free: one round trip,
    // no write, no follow-up read.
    server: {
      method: 'GET',
      url: `${baseUrl.replace(/\/$/, '')}/availability?date={{args.date}}&time={{args.time}}&party_size={{args.party_size}}`,
      // Fail fast instead of stalling the turn behind a slow backend; the
      // prompt handles the "checking is unavailable" fallback.
      timeout_ms: 1200,
    },
    execution: { mode: 'sync' },
  };
}

// agentUid identifies the AI in the RTC channel and shares its default with the client.
const agentUid = String(DEFAULT_AGENT_UID);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    // --- 1. Parse request ---

    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name } = body;

    // Validate required env vars on first request so misconfiguration surfaces
    // with a clear error message rather than a silent failure.
    const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');

    if (!channel_name || !requester_id) {
      return NextResponse.json(
        { error: 'channel_name and requester_id are required' },
        { status: 400 },
      );
    }

    // --- 2. Build and start the agent ---

    // Availability lookup is only advertised to the LLM when a backend is
    // configured, so an unset env var degrades to a prompt-only agent instead
    // of a tool that always errors mid-turn.
    const tool = availabilityTool();

    // AgoraClient authenticates API calls to the Agora Conversational AI service.
    // area: change to Area.EU or Area.AP for European or Asia-Pacific deployments.
    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    // Pipeline: Deepgram (reseller) STT → OpenAI (reseller) LLM → MiniMax (reseller) TTS.
    // Omit vendor API keys for supported models — AgentKit infers reseller presets on start (see Agora Console / billing).
    const agent = new Agent({
      client,
      instructions: PRIYA_PROMPT,
      greeting: GREETING,
      failureMessage: 'Sorry, I missed that. Could you say it again?',
      maxHistory: 12,
      // VAD controls how the agent detects the start and end of a user's turn.
      // Tuned for snappy handoff: the agent starts listening after 320 ms of
      // silence (down from 480 ms) and barges in after 120 ms of speech.
      turnDetection: {
        config: {
          speech_threshold: 0.5,
          start_of_speech: {
            mode: 'vad',
            vad_config: {
              interrupt_duration_ms: 120, // ms of speech before interruption triggers
              prefix_padding_ms: 250, // audio captured before speech is detected
            },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: {
              silence_duration_ms: 320, // ms of silence before turn ends
            },
          },
        },
      },
      // RTM is required for transcript events in the browser client.
      // enable_tools turns on the inline REST tool loop for check_availability.
      // Leave it on even without a tool URL: the flag is what allows any tool
      // to be added later without changing session startup.
      advancedFeatures: { enable_rtm: true, enable_tools: true },
      // Required for browser RTM events:
      // - data_channel: 'rtm' enables RTM delivery path for state/metrics/errors
      // - enable_error_message emits AGENT_ERROR payloads
      // - enable_metrics emits AGENT_METRICS latency payloads
      parameters: {
        // web client → ultra-low-latency chorus profile
        audio_scenario: 'chorus',
        data_channel: 'rtm',
        enable_error_message: true,
        enable_metrics: true,
      },
    })
      .withStt(
        new DeepgramSTT({
          model: 'nova-3',
          language: 'en',
        }),
        // BYOK: uncomment the following block and set NEXT_DEEPGRAM_API_KEY
        // new DeepgramSTT({
        //   apiKey: requireEnv('NEXT_DEEPGRAM_API_KEY'),
        //   model: 'nova-3',
        //   language: 'en',
        // }),
      )
      .withLlm(
        new OpenAI({
          model: 'gpt-4o-mini',
          greetingMessage: GREETING,
          failureMessage: 'Sorry, I missed that. Could you say it again?',
          // Short memory window: fewer tokens in, faster first token out. The
          // booking state we need lives in the tool results, not the history.
          maxHistory: 12,
          templateVariables: TEMPLATE_VARIABLES,
          // The pipeline streams LLM tokens into TTS as they arrive; keeping
          // replies to two sentences is what makes that streaming audible.
          params: {
            max_tokens: 160,
            temperature: 0.4,
            top_p: 0.9,
          },
          tools: tool ? [tool] : undefined,
        }),
        // BYOK: uncomment the following block and set NEXT_LLM_API_KEY and NEXT_LLM_URL
        // new OpenAI({
        //   apiKey: requireEnv('NEXT_LLM_API_KEY'),
        //   url: requireEnv('NEXT_LLM_URL'),
        //   model: 'gpt-4o-mini',
        //   greetingMessage: GREETING,
        //   failureMessage: 'Sorry, I missed that. Could you say it again?',
        //   maxHistory: 12,
        //   params: {
        //     max_tokens: 160,
        //     temperature: 0.4,
        //     top_p: 0.9,
        //   },
        // }),
      )
      .withTts(
        new MiniMaxTTS({
          model: 'speech_2_6_turbo',
          voiceId: 'English_captivating_female1',
        }),
        // BYOK — ElevenLabs (set NEXT_ELEVENLABS_API_KEY; optional NEXT_ELEVENLABS_VOICE_ID)
        // new (await import('agora-agents')).ElevenLabsTTS({
        //   key: requireEnv('NEXT_ELEVENLABS_API_KEY'),
        //   modelId: 'eleven_flash_v2_5',
        //   voiceId: process.env.NEXT_ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB',
        //   sampleRate: 24000,
        // }),
      );

    // remoteUids restricts the agent to only process audio from this user
    const session = agent.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false, // enable debug to show restful API calls in the console
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start conversation',
      },
      { status: 500 },
    );
  }
}
