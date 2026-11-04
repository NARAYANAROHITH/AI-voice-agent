import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  ExpiresIn,
  Gemini,
  Groq,
  OpenAI,
  SarvamSTT,
  SarvamTTS,
} from 'agora-agents';
import type { LlmTool } from 'agora-agents';
import { ClientStartRequest, AgentResponse } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';

<<<<<<< HEAD
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
=======
// ─── System Prompt ────────────────────────────────────────────────────────────
// Spice Garden restaurant booking agent. Speaks English, Hindi, and Telugu.
// Automatically detects and matches the caller's language.
const SYSTEM_PROMPT = `You are **Priya**, the friendly AI receptionist at **Spice Garden**, a popular Indian restaurant in Bangalore.

# Your Role
You handle incoming calls to take, modify, and cancel table reservations. You speak English, Hindi, and Telugu fluently.

# Language Detection (Critical)
- Listen to the very first words the caller speaks.
- Detect whether they are speaking English, Hindi, or Telugu.
- Immediately switch to that language for the rest of the conversation.
- If they switch languages mid-call, follow them.
- If unsure, use English.
- Never mix languages in a single response.

# Restaurant Information
- Name: Spice Garden
- Location: 42 MG Road, Bangalore
- Hours: 12:00 PM to 11:00 PM, every day
- Cuisines: South Indian, North Indian, Chinese
- Last booking: 11:00 PM

# Conversation Style (Voice-First)
- Keep every response to 1-2 short sentences. This is a phone call.
- Never use lists, bullet points, or markdown - it will be read aloud.
- Speak naturally, like a warm and efficient receptionist.
- Ask one question at a time.
- Confirm all booking details before calling create_booking.

# Booking Flow
1. Greet the caller warmly.
2. Collect the number of guests, preferred date, and time.
3. Call check_availability to verify table availability.
4. If available: ask for their name and phone number.
5. Once you have their phone number (or when they say confirm), immediately call create_booking with whatever phone digits were provided.
6. Read back the table number and booking confirmation ID warmly.
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef

# Modification / Cancellation Flow
1. Ask for their phone number.
2. Call get_bookings_by_phone to find their reservation.
3. Confirm the reservation details with the caller.
4. Call modify_booking or cancel_booking as requested.
5. Confirm the change.

# Tool Usage Rules
- ALWAYS call check_availability before create_booking. Never promise availability without checking.
- NEVER tell a caller their booking is confirmed until create_booking returns success=true.
- Pass dates as YYYY-MM-DD and times as HH:MM (24h) in IST. If the caller says today or tomorrow, pass that date.
- Pass phone numbers as given by the caller without altering digits.
- If a tool returns an error, apologize briefly and offer to try a different time.

# Greetings by Language
- English: "Thank you for calling Spice Garden! This is Priya. How may I help you today?"
- Hindi: "Spice Garden mein aapka swagat hai! Main Priya hoon. Aap kaise madad chahenge?"
- Telugu: "Spice Garden ki pilvani ki dhanywadalu! Nenu Priya. Meeru ela sahayam chesali?"`;

const GREETING = `Thank you for calling Spice Garden! This is Priya. How may I help you today?`;

// agentUid identifies the AI in the RTC channel - must match DEFAULT_AGENT_UID
const agentUid = String(DEFAULT_AGENT_UID);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// ─── Tool base URL ─────────────────────────────────────────────────────────────
// In production this will be your Vercel deployment URL.
// In local dev, use ngrok: ngrok http 3000 then set NEXT_PUBLIC_APP_URL.
function getToolBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return url.replace(/\/$/, '');
}

// ─── Restaurant Tool Definitions ───────────────────────────────────────────────
// Tools are defined as OpenAI function-calling schemas with HTTP execution.
// Agora ConvAI engine calls these webhooks when the LLM invokes a tool.
function buildRestaurantTools(): LlmTool[] {
  const base = getToolBaseUrl();

  // Agora cloud blocks localhost webhook URLs.
  // To enable HTTP tool calling in local dev, run `npx localtunnel --port 3000` or `ngrok http 3000`
  // and set NEXT_PUBLIC_APP_URL to the public HTTPS tunnel URL.
  if (base.includes('localhost') || base.includes('127.0.0.1')) {
    console.warn(
      '[invite-agent] NEXT_PUBLIC_APP_URL is localhost. Agora cloud blocks localhost webhooks. ' +
      'Tools are disabled until a public HTTPS URL (ngrok/localtunnel/Vercel) is set in NEXT_PUBLIC_APP_URL.',
    );
    return [];
  }

  return [
    {
      type: 'function',
      function: {
        name: 'check_availability',
        description:
          'Check if a table is available at Spice Garden for a given date, time, and party size. Always call this before create_booking.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Reservation date in YYYY-MM-DD format (IST)',
            },
            time: {
              type: 'string',
              description: 'Reservation time in HH:MM 24h format (IST), e.g. "19:30"',
            },
            party_size: {
              type: 'integer',
              description: 'Number of guests',
            },
          },
          required: ['date', 'time', 'party_size'],
        },
      },
      server: {
        url: `${base}/api/tools/check-availability`,
        method: 'POST',
        body: {
          date: '{{args.date}}',
          time: '{{args.time}}',
          party_size: '{{args.party_size}}',
        },
        timeout_ms: 8000,
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_booking',
        description:
          'Create a confirmed table reservation at Spice Garden. Only call this after check_availability confirms availability and you have collected all required details from the caller.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Reservation date YYYY-MM-DD (IST)' },
            time: { type: 'string', description: 'Reservation time HH:MM 24h (IST)' },
            party_size: { type: 'integer', description: 'Number of guests' },
            customer_name: { type: 'string', description: 'Full name of the customer' },
            customer_phone: {
              type: 'string',
              description: 'Customer phone number (include +91 if given)',
            },
            special_requests: {
              type: 'string',
              description: 'Any dietary restrictions, occasion, or seating preferences',
            },
          },
          required: ['date', 'time', 'party_size', 'customer_name', 'customer_phone'],
        },
      },
      server: {
        url: `${base}/api/tools/create-booking`,
        method: 'POST',
        body: {
          date: '{{args.date}}',
          time: '{{args.time}}',
          party_size: '{{args.party_size}}',
          customer_name: '{{args.customer_name}}',
          customer_phone: '{{args.customer_phone}}',
          special_requests: '{{args.special_requests}}',
        },
        timeout_ms: 10000,
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_bookings_by_phone',
        description:
          'Look up existing upcoming reservations for a customer by their phone number. Call this when a customer wants to cancel or modify a booking.',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: {
              type: 'string',
              description: 'Customer phone number',
            },
          },
          required: ['customer_phone'],
        },
      },
      server: {
        url: `${base}/api/tools/get-bookings-by-phone`,
        method: 'POST',
        body: { customer_phone: '{{args.customer_phone}}' },
        timeout_ms: 8000,
      },
    },
    {
      type: 'function',
      function: {
        name: 'cancel_booking',
        description:
          'Cancel an upcoming reservation. Confirm the booking details with the customer before calling this.',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Customer phone number' },
            booking_id: { type: 'string', description: 'Booking ID if known' },
          },
          required: ['customer_phone'],
        },
      },
      server: {
        url: `${base}/api/tools/cancel-booking`,
        method: 'POST',
        body: {
          customer_phone: '{{args.customer_phone}}',
          booking_id: '{{args.booking_id}}',
        },
        timeout_ms: 8000,
      },
    },
    {
      type: 'function',
      function: {
        name: 'modify_booking',
        description:
          'Modify an existing reservation (change date, time, or party size). Confirm the desired changes with the customer before calling this.',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Customer phone number' },
            booking_id: { type: 'string', description: 'Booking ID if known' },
            new_date: { type: 'string', description: 'New date YYYY-MM-DD (IST)' },
            new_time: { type: 'string', description: 'New time HH:MM 24h (IST)' },
            new_party_size: { type: 'integer', description: 'New party size' },
          },
          required: ['customer_phone'],
        },
      },
      server: {
        url: `${base}/api/tools/modify-booking`,
        method: 'POST',
        body: {
          customer_phone: '{{args.customer_phone}}',
          booking_id: '{{args.booking_id}}',
          new_date: '{{args.new_date}}',
          new_time: '{{args.new_time}}',
          new_party_size: '{{args.new_party_size}}',
        },
        timeout_ms: 10000,
      },
    },
  ];
}

function buildLlm(apiKey: string, tools: LlmTool[]) {
  const modelOverride = process.env.NEXT_LLM_MODEL;

  // Google Gemini API keys (e.g. starting with "AQ." or "AIzaSy")
  if (apiKey.startsWith('AQ.') || apiKey.startsWith('AIzaSy')) {
    return new Gemini({
      apiKey,
      model: modelOverride || 'gemini-3.5-flash-lite',
      failureMessage: 'Please wait a moment. Ek pal rukiye.',
      maxHistory: 20,
      params: {
        generationConfig: {
          temperature: 0.5,
          topP: 0.95,
          maxOutputTokens: 256,
        },
      },
      tools,
    });
  }

  // Groq API keys (starting with "gsk_")
  if (apiKey.startsWith('gsk_')) {
    return new Groq({
      apiKey,
      url: process.env.NEXT_LLM_URL || 'https://api.groq.com/openai/v1/chat/completions',
      model: modelOverride || 'llama-3.3-70b-versatile',
      greetingMessage: GREETING,
      failureMessage: 'Please wait a moment. Ek pal rukiye.',
      maxHistory: 20,
      maxTokens: 512,
      temperature: 0.6,
      topP: 0.95,
      tools,
    });
  }

  // Standard OpenAI (or custom OpenAI-compatible endpoint)
  return new OpenAI({
    apiKey,
    url: process.env.NEXT_LLM_URL || 'https://api.openai.com/v1/chat/completions',
    model: modelOverride || 'gpt-4o',
    greetingMessage: GREETING,
    failureMessage: 'Please wait a moment. Ek pal rukiye.',
    maxHistory: 20,
    maxTokens: 512,
    temperature: 0.6,
    topP: 0.95,
    tools,
  });
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name } = body;

    const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');
    const sarvamApiKey = requireEnv('NEXT_SARVAM_API_KEY');
    const llmApiKey = process.env.NEXT_LLM_API_KEY || process.env.GEMINI_API_KEY;

    if (!llmApiKey) {
      throw new Error('Missing required environment variable: NEXT_LLM_API_KEY or GEMINI_API_KEY');
    }

    if (!channel_name || !requester_id) {
      return NextResponse.json(
        { error: 'channel_name and requester_id are required' },
        { status: 400 },
      );
    }

    // 2. Build and start the agent
    //    Area.AP routes audio through Agora's Asia-Pacific edge nodes -
    //    lower latency for India callers and TRAI-friendly media routing.
    const client = new AgoraClient({ area: Area.AP, appId, appCertificate });

<<<<<<< HEAD
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
=======
    const agent = new Agent({
      client,
      instructions: SYSTEM_PROMPT,
      greeting: GREETING,
      failureMessage: 'Please wait a moment. Ek pal rukiye.',
      maxHistory: 30,
      // VAD tuned for phone-quality audio with code-switching pauses
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef
      turnDetection: {
        config: {
          speech_threshold: 0.45,
          start_of_speech: {
            mode: 'vad',
            vad_config: {
<<<<<<< HEAD
              interrupt_duration_ms: 120, // ms of speech before interruption triggers
              prefix_padding_ms: 250, // audio captured before speech is detected
=======
              interrupt_duration_ms: 200,
              prefix_padding_ms: 300,
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef
            },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: {
<<<<<<< HEAD
              silence_duration_ms: 320, // ms of silence before turn ends
=======
              silence_duration_ms: 600, // slightly longer for language-switching pauses
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef
            },
          },
        },
      },
<<<<<<< HEAD
      // RTM is required for transcript events in the browser client.
      // enable_tools turns on the inline REST tool loop for check_availability.
      // Leave it on even without a tool URL: the flag is what allows any tool
      // to be added later without changing session startup.
=======
      // RTM required for browser transcript events.
      // enable_tools required for HTTP tool invocation.
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef
      advancedFeatures: { enable_rtm: true, enable_tools: true },
      parameters: {
        audio_scenario: 'chorus',
        data_channel: 'rtm',
        enable_error_message: true,
        enable_metrics: true,
      },
    })
      // ── STT: Sarvam AI (Saaras) ───────────────────────────────────────────
      // Native Indian language model. language='unknown' enables auto-detection
      // across hi, te, and en including code-switching (Hinglish / Tanglish).
      .withStt(
<<<<<<< HEAD
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
=======
        new SarvamSTT({
          apiKey: sarvamApiKey,
          language: 'unknown',
          additionalParams: {
            language_hints: ['hi', 'te', 'en'],
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef
          },
          tools: tool ? [tool] : undefined,
        }),
<<<<<<< HEAD
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
=======
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef
      )
      // ── LLM: Multi-Provider (Gemini / Groq / OpenAI) ─────────────────────
      .withLlm(buildLlm(llmApiKey, buildRestaurantTools()))
      // ── TTS: Sarvam AI (Bulbul) ───────────────────────────────────────────
      // Indian-native TTS engine. Natively speaks hi-IN, te-IN, and en-IN.
      // The LLM produces text in the detected language; Bulbul renders it.
      .withTts(
        new SarvamTTS({
          key: sarvamApiKey,
          speaker: 'priya',             // Bulbul v3 compatible voice
          targetLanguageCode: 'en-IN',  // Bulbul auto-detects script; en-IN is the fallback
          pace: 1.1,                    // slightly faster for natural phone speech
        }),
      );

    const session = agent.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false,
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error('Error starting Spice Garden agent:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to start conversation',
      },
      { status: 500 },
    );
  }
}
