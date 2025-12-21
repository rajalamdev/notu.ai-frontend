import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Send user data to backend to create/update user
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId: profile?.sub,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });

          if (!response.ok) {
            console.error('Backend auth failed');
            return false;
          }

          const data = await response.json();
          
          // Store backend token in user object
          if (data.success && data.data?.token) {
            (user as any).backendToken = data.data.token;
            (user as any).backendUser = data.data.user;
          }

          return true;
        } catch (error) {
          console.error('Error syncing with backend:', error);
          return true; // Still allow sign in even if backend sync fails
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          backendToken: (user as any).backendToken,
          backendUser: (user as any).backendUser,
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      return {
        ...session,
        accessToken: token.accessToken,
        backendToken: token.backendToken,
        user: {
          ...session.user,
          id: (token.backendUser as any)?.id,
          plan: (token.backendUser as any)?.plan || 'free',
        },
      };
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
