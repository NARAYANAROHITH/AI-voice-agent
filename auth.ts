/**
 * NextAuth v5 configuration for dashboard authentication.
 * Uses the credentials provider with a single staff username/password
 * stored in environment variables.
 *
 * NEXT_DASHBOARD_USER  — dashboard login username (default: "admin")
 * NEXT_DASHBOARD_PASS  — dashboard login password (required)
 * NEXTAUTH_SECRET      — random secret for JWT signing (required)
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validUser = process.env.NEXT_DASHBOARD_USER ?? 'admin';
        const validPass = process.env.NEXT_DASHBOARD_PASS;

        if (!validPass) {
          console.error('NEXT_DASHBOARD_PASS is not set');
          return null;
        }

        if (
          credentials.username === validUser &&
          credentials.password === validPass
        ) {
          return { id: '1', name: 'Restaurant Staff', email: 'staff@spicegarden.in' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/dashboard/login',
  },
  session: { strategy: 'jwt' },
});
