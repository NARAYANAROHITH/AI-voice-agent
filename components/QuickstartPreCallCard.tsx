'use client';

import { useState } from 'react';
import {
  Loader2,
  PhoneCall,
  Utensils,
  Mic,
  Menu,
  X,
  MapPin,
  Phone,
  Clock,
  CalendarCheck,
  Languages,
  CalendarClock,
  ArrowRight,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface QuickstartPreCallCardProps {
  isLoading: boolean;
  error: string | null;
  onStartConversation?: () => void;
  onStart?: () => void;
}

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const;

const LANGUAGES = ['English', 'Hindi', 'Telugu'] as const;

const SAMPLE_REQUESTS = [
  'I need a table for 4 tonight at 8 PM',
  'Aaj raat 8:30 baje 2 logon ke liye table mil sakta hai?',
  'Repu 7:30 PM ki 3 members ki table book cheyyi',
];

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
  onStart,
}: QuickstartPreCallCardProps) {
  const handleStart = onStartConversation ?? onStart;
  const [menuOpen, setMenuOpen] = useState(false);

  const reserveButton = (
    <button
      onClick={handleStart}
      disabled={isLoading}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={isLoading ? 'Connecting to Priya' : 'Reserve a table with Priya'}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Connecting to Priya…
        </>
      ) : (
        <>
          <CalendarCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Reserve a Table
        </>
      )}
    </button>
  );

  return (
    <div className="flex w-full flex-col bg-white text-[#1F2937]">
      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#home" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C2410C]">
              <Utensils className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-[#1F2937]">
                Spice Garden
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">
                Fine Indian Dining
              </p>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#1F2937] transition-colors hover:text-[#C2410C]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            {reserveButton}
            <Link
              href="/dashboard"
              className="text-xs font-medium text-[#9CA3AF] transition-colors hover:text-[#C2410C]"
            >
              Staff Dashboard
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E7EB] text-[#1F2937] md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="border-t border-[#E5E7EB] bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-[#1F2937] hover:bg-[#F9FAFB] hover:text-[#C2410C]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-2 flex flex-col gap-2 px-3">
              {reserveButton}
              <Link
                href="/dashboard"
                className="py-2 text-center text-xs font-medium text-[#9CA3AF] hover:text-[#C2410C]"
              >
                Staff Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== Hero ===== */}
      <section id="home" className="bg-[#F9FAFB]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C2410C]">
              <Utensils className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Fine Indian Dining
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-[#1F2937] sm:text-5xl">
                Welcome to <span className="text-[#C2410C]">Spice Garden</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-[#4B5563] sm:text-lg">
                A warm, welcoming place to enjoy thoughtfully prepared Indian
                cuisine — aromatic curries, freshly baked naan, and generous
                hospitality, all in the heart of the neighbourhood.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 pt-1 sm:flex-row">
              <a
                href="#about"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#1F2937] transition-colors hover:border-[#C2410C] hover:text-[#C2410C]"
              >
                Explore
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </a>
              {reserveButton}
            </div>
            {error && (
              <div
                role="alert"
                className="flex w-full items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-[#DC2626]"
              >
                <span className="font-medium">Connection issue:</span> {error}
              </div>
            )}
          </div>
          <div className="relative h-72 w-full overflow-hidden rounded-xl border border-[#E5E7EB] sm:h-96 lg:h-[28rem]">
            <Image
              src="/images/spicegarden/interior.jpg"
              alt="The dining room at Spice Garden restaurant"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section id="about" className="scroll-mt-20 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C2410C]">
              About Spice Garden
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
              A dining experience rooted in flavour and warmth
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4B5563]">
              Spice Garden is a neighbourhood Indian restaurant bringing classic
              regional dishes to your table with care and consistency. From
              slow-simmered curries and tandoor-fresh breads to fragrant
              biryanis, every plate is prepared with quality ingredients and
              served in a relaxed, family-friendly setting.
            </p>
            <p className="mt-3 text-base leading-relaxed text-[#4B5563]">
              Whether you are joining us for a quiet weeknight dinner, a family
              celebration, or a meal with friends, our team is committed to
              making every visit comfortable and memorable — from the moment
              you walk in to the moment you leave.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Meet Priya ===== */}
      <section className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C2410C]">
              Meet Priya
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
              Your AI Receptionist
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4B5563]">
              Priya is Spice Garden&apos;s AI voice receptionist. Instead of
              waiting on hold or filling out forms, simply call and speak to
              Priya naturally. She can help you with:
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  icon: CalendarClock,
                  text: 'Checking table availability for your preferred date and time',
                },
                {
                  icon: CalendarCheck,
                  text: 'Booking a restaurant table for your party, big or small',
                },
                {
                  icon: PhoneCall,
                  text: 'Making reservations through simple voice conversations',
                },
                {
                  icon: Languages,
                  text: 'Communicating comfortably in English, Hindi, and Telugu',
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-white">
                    <Icon className="h-4 w-4 text-[#C2410C]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-relaxed text-[#1F2937]">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={isLoading ? 'Connecting to Priya' : 'Start a voice call with Priya'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Connecting to Priya…
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    Book with Priya
                  </>
                )}
              </button>
              <p className="text-xs text-[#6B7280]">No forms, no app download — just talk.</p>
            </div>
          </div>

          {/* Sample requests */}
          <div className="w-full self-center">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <p className="text-sm font-semibold text-[#1F2937]">Try saying…</p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    Sample requests Priya understands
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F9FAFB]">
                  <Mic className="h-4 w-4 text-[#C2410C]" strokeWidth={1.75} aria-hidden="true" />
                </div>
              </div>
              <ul className="space-y-2.5">
                {SAMPLE_REQUESTS.map((request) => (
                  <li
                    key={request}
                    className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-3 text-sm leading-snug text-[#1F2937]"
                  >
                    <span className="mr-2 font-semibold text-[#C2410C]">“</span>
                    {request}
                    <span className="ml-2 font-semibold text-[#C2410C]">”</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E5E7EB] pt-4">
                <Languages className="h-4 w-4 text-[#6B7280]" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-sm text-[#6B7280]">Speaks</span>
                {LANGUAGES.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium text-[#1F2937]"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="scroll-mt-20 border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C2410C]">
            Contact
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
            Visit Spice Garden
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: MapPin,
                label: 'Address',
                value: '42 MG Road, Bangalore',
              },
              {
                icon: Clock,
                label: 'Opening Hours',
                value: '12:00 PM – 11:00 PM, every day',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white">
                  <Icon className="h-5 w-5 text-[#C2410C]" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#1F2937]">{label}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{value}</p>
              </div>
            ))}
            {/* Phone: connects straight to Priya (the AI receptionist) via the existing voice-call flow */}
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-left transition-colors hover:border-[#C2410C] focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={isLoading ? 'Connecting to Priya' : 'Call Priya, the AI receptionist'}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#C2410C]" aria-hidden="true" />
                ) : (
                  <Phone className="h-5 w-5 text-[#C2410C]" strokeWidth={1.75} aria-hidden="true" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1F2937]">Phone</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                {isLoading
                  ? 'Connecting you to Priya…'
                  : 'Tap to call Priya, our AI receptionist — she answers and books your table'}
              </p>
            </button>
          </div>
          <p className="mt-6 text-xs text-[#6B7280]">
            Tap the Phone card (or Reserve a Table) — Priya will confirm your
            booking by voice.
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-[#E5E7EB] bg-[#1F2937] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C2410C]">
              <Utensils className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight">Spice Garden</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D1D5DB]">
                Fine Indian Dining
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#D1D5DB] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => handleStart?.()}
              disabled={isLoading}
              className="text-sm font-medium text-[#D1D5DB] transition-colors hover:text-white disabled:opacity-60"
            >
              Reserve a Table
            </button>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] transition-colors hover:text-white"
          >
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Staff Dashboard
          </Link>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
            <p className="text-xs text-[#9CA3AF]">
              © {new Date().getFullYear()} Spice Garden. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default QuickstartPreCallCard;
