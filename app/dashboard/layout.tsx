import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spice Garden — Restaurant Management',
  description: 'Manage reservations, tables, and call history for Spice Garden restaurant.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
