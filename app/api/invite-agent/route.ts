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
      model: modelOverride || 'gemini-3-flash-preview',
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

    const agent = new Agent({
      client,
      instructions: SYSTEM_PROMPT,
      greeting: GREETING,
      failureMessage: 'Please wait a moment. Ek pal rukiye.',
      maxHistory: 30,
      // VAD tuned for phone-quality audio with code-switching pauses
      turnDetection: {
        config: {
          speech_threshold: 0.45,
          start_of_speech: {
            mode: 'vad',
            vad_config: {
              interrupt_duration_ms: 200,
              prefix_padding_ms: 300,
            },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: {
              silence_duration_ms: 600, // slightly longer for language-switching pauses
            },
          },
        },
      },
      // RTM required for browser transcript events.
      // enable_tools required for HTTP tool invocation.
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
        new SarvamSTT({
          apiKey: sarvamApiKey,
          language: 'unknown',
          additionalParams: {
            language_hints: ['hi', 'te', 'en'],
          },
        }),
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
