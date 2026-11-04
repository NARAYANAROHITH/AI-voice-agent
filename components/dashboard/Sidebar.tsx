'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Utensils,
  ClipboardList,
  Armchair,
  PhoneCall,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Reservations', icon: ClipboardList },
  { href: '/dashboard/tables', label: 'Floor & Tables', icon: Armchair },
  { href: '/dashboard/calls', label: 'Voice Calls', icon: PhoneCall },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname() ?? '/dashboard';
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2" aria-label="Spice Garden home">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#B45309]">
            <Utensils className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-[#202124]">Spice Garden</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">
              Staff Portal
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                  active
                    ? 'border-[#E5E7EB] bg-[#F8F9FA] text-[#B45309]'
                    : 'border-transparent text-[#6B7280] hover:text-[#202124]'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-[#6B7280] transition-colors hover:text-[#DC2626]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-[#E5E7EB] bg-white lg:flex">
        <div className="flex flex-col">
          {/* Brand */}
          <div className="border-b border-[#E5E7EB] px-6 py-5">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#B45309] transition-transform group-hover:scale-[1.03]">
                <Utensils className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight text-[#202124]">Spice Garden</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">
                  Staff Management
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-3" aria-label="Staff navigation">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'border-[#E5E7EB] bg-[#F8F9FA] text-[#B45309] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#202124]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-[#B45309]' : 'text-[#6B7280]'}`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F8F9FA] text-xs font-semibold text-[#B45309]">
                A
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-[#202124]">Admin Staff</p>
                <p className="mt-0.5 text-[10px] text-[#6B7280]">Manager access</p>
              </div>
            </div>
            <span
              className="h-2 w-2 rounded-full bg-[#16A34A]"
              title="Signed in"
              aria-hidden="true"
            />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280] transition-colors hover:border-[#FECACA] hover:text-[#DC2626]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Sign out
          </button>

          <Link
            href="/"
            className="mt-2 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#202124]"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            Back to customer line
          </Link>
        </div>
      </aside>
    </>
  );
}
